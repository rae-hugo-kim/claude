// Unit tests for isGitCommit() — the shared commit-gate detector used by
// acceptance-gate / backpressure-gate / review-gate.
//
// Run: node --test tests/git-commit-detect.test.mjs
//
// Covers the two defects of the old regex
//   /(?:^|&&|\|\||;)\s*git\b[^|;]*\bcommit\b/  plus the bypass / false-positive
// classes surfaced by adversarial review (Codex + code-reviewer):
//   (1) false-NEGATIVE: real `git commit` missed when separated by newline / single &,
//       behind env-with-quoted-value / wrapper-with-options prefixes, behind bash -c
//       variants (-lc, /bin/bash -c, sh -ec), or behind shell reserved words.
//   (2) false-POSITIVE: fired on non-commit git commands that merely contain "commit"
//       as an argument, on commented-out / heredoc-body text, and on terminal git
//       global options (--help/--version) preceding the word commit.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isGitCommit } from '../.claude/hooks/harness/git-commit-detect.mjs';

// --- Should DETECT (true): a real `git commit` invocation in some segment ---
const DETECT = [
  'git commit',
  'git commit -m x',
  'git commit -m "msg; with | ops"',            // operators inside quotes are data
  'git add -A && git commit -m x',
  'git add . ; git commit',
  'cd foo\ngit commit -m x',                     // newline-separated (original bug1)
  'echo hi\ngit commit',
  'foo & git commit',                            // single & separator (original bug1)
  'true && git commit || echo fail',             // commit in a middle segment
  '   git commit   ',                            // surrounding whitespace
  'git\tcommit',                                 // tab between git and subcommand
  'git commit --amend --no-edit',
  // global options before the subcommand
  'git -C /other commit',                        // cross-repo not special-cased -> still a commit
  'git -c user.name="A B" commit',               // -c flag with quoted value
  'git --git-dir=/x commit',
  'git --git-dir /x commit',                     // --git-dir space form (consumes arg)
  '/usr/bin/git commit',                         // full path to git
  // env-assignment prefixes (incl. quoted values containing spaces)
  "GIT_AUTHOR_DATE='2020-01-01' git commit -m x",
  'GIT_AUTHOR_DATE="2020-01-01 12:00:00" git commit',
  'env GIT_AUTHOR_DATE="x y" git commit',
  'env -i git commit',
  // wrapper commands with their own options (arity not modelled — program is scanned for)
  'nice -n 10 git commit',
  'sudo -E git commit',
  'time -p git commit',
  'timeout 5 git commit',
  'command git commit',
  'nohup git commit',
  'env --chdir /tmp git commit',                 // long option with separate arg
  'timeout --signal KILL 5 git commit',
  'ionice -c 2 -n 7 git commit',
  'nice --adjustment 10 git commit',
  'sudo --user root git commit',
  // path-qualified wrappers (matched by basename)
  '/usr/bin/env git commit',
  '/usr/bin/time -p git commit',
  '/usr/bin/nice -n 10 git commit',
  'exec git commit',                             // exec replaces the shell with git commit
  'exec -a name git commit',
  // subshell / group / reserved words
  '(git commit)',
  '{ git commit; }',
  'echo a && (cd d && git commit)',
  'if git commit -m x; then echo ok; fi',
  'if true; then git commit; fi',
  '! git commit',
  // bash -c / sh -c variants (recursion)
  "bash -c 'git commit -m x'",
  'sh -c "git add -A && git commit"',
  'bash -lc "git commit"',
  'bash --noprofile -c "git commit"',
  "sh -ec 'git commit'",
  '/bin/bash -c "git commit"',
  "bash -o pipefail -c 'git commit'",            // shell option with separate arg before -c
  "bash -O extglob -c 'git commit'",
  // git global option with a separate argument
  'git --config-env user.name=GIT_AUTHOR_NAME commit',
  // real commit AFTER a (hyphenated-delimiter) heredoc body is closed
  'cat <<END-MSG\nbody\nEND-MSG\ngit commit',
  'bash -c "git commit" # trailing comment',     // comment after the wrapped command
  'bash -c \'bash -c "git commit"\'',            // 2-level nesting
];

// --- Should NOT detect (false) ---
const SKIP = [
  // non-commit git subcommands that merely contain the word "commit" (original bug2)
  'git log --grep commit',
  'git log --grep=commit',
  'git checkout feature/commit-x',
  'git diff main..my-commit',
  'git show HEAD --stat',
  'git branch commit-x',
  'git rev-parse HEAD^{commit}',
  // sibling subcommands whose name merely starts with "commit"
  'git commit-graph write',
  'git commit-tree abc123',
  'git config commit.gpgsign true',
  'git config --get commit.template',
  // terminal/informational git global options short-circuit before any subcommand
  'git --help commit',
  'git --version commit',
  // wrapper terminal options print help/version and never exec git
  'env --help git commit',
  'nice --help git commit',
  'timeout --version git commit',
  // quoted data, not an invocation
  "grep -r 'git commit' .",
  'echo "git commit"',
  'cat commit.txt',
  // commented-out / heredoc-body text must not fire (false-positive regression guard)
  'git status # ; git commit',
  'cat <<EOF\ngit commit\nEOF',
  'ssh host <<EOF\ngit commit\nEOF',
  "cat <<'END-MSG'\ngit commit\nEND-MSG",          // hyphenated quoted heredoc delimiter
  'cat <<"X-Y"\ngit commit\nX-Y',
  // other non-commit commands
  'git status',
  'git push',
  'npm run commit',
  'echo committing && git status',
  'git log --oneline | grep commit',
  'bash -c "git log"',
  'gitfoo commit',
  '',
  '   ',
  // known/accepted gaps: NOT detected — exotic, outside the (non-adversarial) agent
  // threat model; documented in the module header and pinned here so the behavior is
  // intentional rather than a silent oversight.
  '$(echo git) commit',                            // commit inside command substitution
  'echo "$(git commit)"',
  "env -S 'git commit -m x'",                      // env split-string exec
  'case x in x) git commit;; esac',                // case-pattern body
];

test('detects real git commit invocations', () => {
  for (const cmd of DETECT) {
    assert.equal(isGitCommit(cmd), true, `expected DETECT: ${JSON.stringify(cmd)}`);
  }
});

test('does not fire on non-commit / commented / heredoc / quoted commands', () => {
  for (const cmd of SKIP) {
    assert.equal(isGitCommit(cmd), false, `expected SKIP: ${JSON.stringify(cmd)}`);
  }
});

// Build N levels of valid nested `bash -c "<inner>"` (escape \ and " each level).
function nest(inner, levels) {
  let cmd = inner;
  for (let i = 0; i < levels; i++) {
    cmd = `bash -c "${cmd.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return cmd;
}

test('fails closed on pathologically deep bash -c nesting', () => {
  // A shallow nest is parsed exactly: a non-commit core stays non-commit.
  assert.equal(isGitCommit(nest('git log', 2)), false, 'shallow nest descends correctly');
  // Past MAX_DEPTH the recursion can no longer prove the inner is harmless, so the
  // gate must fail CLOSED (treat as a commit), never silently allow.
  assert.equal(isGitCommit(nest('git commit', 8)), true, 'deep commit nest detected');
  assert.equal(isGitCommit(nest('git log', 8)), true, 'deep nest fails closed even for a non-commit core');
});

test('handles non-string input safely', () => {
  assert.equal(isGitCommit(undefined), false);
  assert.equal(isGitCommit(null), false);
  assert.equal(isGitCommit(123), false);
});
