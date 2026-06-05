// Integration tests for review-gate.mjs (PreToolUse: Bash, git commit).
//
// Run: node --test tests/review-gate.test.mjs
//
// Focus: audit P3 review-gate cleanup —
//   (1) diff-hash matching is now a BARE-hash search across ALL of today's
//       reviews, not `content.includes('diff-hash: ' + hash)` on the single
//       lexicographically-last doc. This fixes (a) multiple PRs the same day
//       shadowing each other (the wrong doc was picked by sort().pop()) and
//       (b) non-standard label formats like "diff-hash (initial review): <h>".
//   (2) a FAIL verdict blocks only when it covers the CURRENT diff (precise),
//       instead of whichever doc sorted last.
//   (3) the dead `shell: true` option on execSync was removed (execSync always
//       shells); these tests fail if hash computation broke.
//
// Spawn-based with an EXPLICIT cwd throwaway git repo (memory:
// feedback_shell_test_cwd_isolation). Risk level is driven by the staged files.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const GATE = join(dirname(fileURLToPath(import.meta.url)), '..', '.claude', 'hooks', 'harness', 'review-gate.mjs');
const TODAY = new Date().toISOString().slice(0, 10);

const HIGH = { 'src/big.ts': 'export const x = 1;\n'.repeat(120) }; // code, >100 lines -> high
const LOW = { 'docs/notes.md': '# notes\nprose\n' };               // prose doc -> low

function makeRepo(files) {
  const dir = mkdtempSync(join(tmpdir(), 'rv-gate-'));
  const git = (args) => {
    const r = spawnSync('git', args, { cwd: dir, encoding: 'utf-8' });
    if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`);
  };
  git(['init', '-q']);
  git(['config', 'user.email', 't@example.com']);
  git(['config', 'user.name', 'Test']);
  for (const [rel, content] of Object.entries(files)) {
    const fp = join(dir, rel);
    mkdirSync(dirname(fp), { recursive: true });
    writeFileSync(fp, content);
  }
  git(['add', '-A']); // stage so assessRisk + the gate hash see them
  return dir;
}

// The same hash the gate computes from the staged diff.
function stagedHash(dir) {
  return execSync('git diff --cached | shasum -a 256', { cwd: dir, encoding: 'utf-8' }).trim().split(/\s+/)[0];
}

// Write an (untracked) review doc so it does not perturb the staged diff.
function writeReview(dir, name, content) {
  const rd = join(dir, 'docs', 'reviews');
  mkdirSync(rd, { recursive: true });
  writeFileSync(join(rd, name), content);
}

function runGate(dir, command = 'git commit -m x') {
  return spawnSync('node', [GATE], {
    input: JSON.stringify({ tool_input: { command }, session_state: { cwd: dir } }),
    cwd: dir,
    encoding: 'utf-8',
  });
}

function withRepo(files, fn) {
  const dir = makeRepo(files);
  try { return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

// --- baseline behaviour (regression guards) ---

test('high risk + no review doc -> BLOCK (exit 2)', () => {
  withRepo(HIGH, (dir) => {
    assert.equal(runGate(dir).status, 2);
  });
});

test('low risk -> allow without any review (exit 0)', () => {
  withRepo(LOW, (dir) => {
    assert.equal(runGate(dir).status, 0);
  });
});

// --- (1) bare-hash matching ---

test('high risk + matching review (standard "diff-hash:" label) -> allow', () => {
  withRepo(HIGH, (dir) => {
    writeReview(dir, `review-${TODAY}-x.md`, `diff-hash: ${stagedHash(dir)}\nVerdict: PASS\n`);
    assert.equal(runGate(dir).status, 0);
  });
});

test('high risk + matching review with non-standard label still matches (bare hash)', () => {
  withRepo(HIGH, (dir) => {
    // The old `includes('diff-hash: ' + hash)` rejected this real-world format.
    writeReview(dir, `review-${TODAY}-x.md`, `diff-hash (initial review): ${stagedHash(dir)}\nVerdict: PASS\n`);
    assert.equal(runGate(dir).status, 0);
  });
});

test('high risk + matching doc is NOT the lexicographically-last of several today -> allow', () => {
  withRepo(HIGH, (dir) => {
    // Matching doc sorts FIRST; an unrelated doc sorts LAST. The old sort().pop()
    // picked the unrelated last doc (no hash) and blocked.
    writeReview(dir, `review-${TODAY}-aaa-match.md`, `diff-hash: ${stagedHash(dir)}\nVerdict: PASS\n`);
    writeReview(dir, `review-${TODAY}-zzz-other.md`, `diff-hash: ${'0'.repeat(64)}\nVerdict: PASS\n`);
    assert.equal(runGate(dir).status, 0);
  });
});

// --- (2) FAIL is scoped to the review that covers the current diff ---

test('high risk + matching review marked FAIL -> BLOCK (exit 2)', () => {
  withRepo(HIGH, (dir) => {
    writeReview(dir, `review-${TODAY}-x.md`, `diff-hash: ${stagedHash(dir)}\nVerdict: FAIL\n`);
    assert.equal(runGate(dir).status, 2);
  });
});

test('high risk + FAIL in a NON-matching doc, PASS in the matching doc -> allow', () => {
  withRepo(HIGH, (dir) => {
    // A stale FAIL for a different diff must not block the corrected commit.
    writeReview(dir, `review-${TODAY}-old-fail.md`, `diff-hash: ${'0'.repeat(64)}\nVerdict: FAIL\n`);
    writeReview(dir, `review-${TODAY}-current.md`, `diff-hash: ${stagedHash(dir)}\nVerdict: PASS\n`);
    assert.equal(runGate(dir).status, 0);
  });
});

test('high risk + a today review exists but none matches the current diff -> BLOCK', () => {
  withRepo(HIGH, (dir) => {
    writeReview(dir, `review-${TODAY}-unrelated.md`, `diff-hash: ${'0'.repeat(64)}\nVerdict: PASS\n`);
    assert.equal(runGate(dir).status, 2);
  });
});

// --- anchored matcher: the hash must be in a diff-hash FIELD, not just prose ---

test('high risk + current hash only in prose (no diff-hash field) -> BLOCK', () => {
  withRepo(HIGH, (dir) => {
    const h = stagedHash(dir);
    // A different PASS review that merely mentions the hash in body text must NOT
    // count as covering this diff.
    writeReview(dir, `review-${TODAY}-prose.md`, `We looked at commit ${h} in passing.\nVerdict: PASS\n`);
    assert.equal(runGate(dir).status, 2);
  });
});

test('high risk + hash under a DIFFERENT field ("previous-diff-hash:") -> BLOCK', () => {
  withRepo(HIGH, (dir) => {
    // The field must begin the line; "previous-diff-hash:" must not count.
    writeReview(dir, `review-${TODAY}-prev.md`, `previous-diff-hash: ${stagedHash(dir)}\nVerdict: PASS\n`);
    assert.equal(runGate(dir).status, 2);
  });
});

test('high risk + "diff-hash:" mid-sentence (not line-start) -> BLOCK', () => {
  withRepo(HIGH, (dir) => {
    writeReview(dir, `review-${TODAY}-mid.md`, `Earlier we wrote diff-hash: ${stagedHash(dir)} but it changed.\nVerdict: PASS\n`);
    assert.equal(runGate(dir).status, 2);
  });
});

test('high risk + matching review with Markdown prefix + CRLF line ending -> allow', () => {
  withRepo(HIGH, (dir) => {
    // Locks the accepted formats the matcher must keep: list/bold markers and CRLF.
    writeReview(dir, `review-${TODAY}-md.md`, `- **diff-hash: ${stagedHash(dir)}**\r\nVerdict: PASS\r\n`);
    assert.equal(runGate(dir).status, 0);
  });
});

test('high risk + hash on the line AFTER "diff-hash:" -> BLOCK (must be same line)', () => {
  withRepo(HIGH, (dir) => {
    // The hash must follow the field on the same line; a line break in between
    // does not count as coverage.
    writeReview(dir, `review-${TODAY}-split.md`, `diff-hash:\n${stagedHash(dir)}\nVerdict: PASS\n`);
    assert.equal(runGate(dir).status, 2);
  });
});

// --- fail-closed: hash cannot be computed (e.g. shasum missing) ---

test('high risk + diff hash uncomputable -> BLOCK (fail-closed)', () => {
  withRepo(HIGH, (dir) => {
    // A today review exists, but with shasum stubbed to fail the gate cannot
    // verify coverage -> unverified -> high/critical must fail closed.
    writeReview(dir, `review-${TODAY}-x.md`, `diff-hash: ${'0'.repeat(64)}\nVerdict: PASS\n`);
    const binDir = mkdtempSync(join(tmpdir(), 'rv-nobin-'));
    writeFileSync(join(binDir, 'shasum'), '#!/bin/sh\nexit 127\n');
    chmodSync(join(binDir, 'shasum'), 0o755);
    try {
      const r = spawnSync('node', [GATE], {
        input: JSON.stringify({ tool_input: { command: 'git commit -m x' }, session_state: { cwd: dir } }),
        cwd: dir,
        encoding: 'utf-8',
        env: { ...process.env, PATH: `${binDir}:${process.env.PATH}` },
      });
      assert.equal(r.status, 2);
    } finally {
      rmSync(binDir, { recursive: true, force: true });
    }
  });
});
