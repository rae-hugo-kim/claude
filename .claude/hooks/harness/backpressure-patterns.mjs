#!/usr/bin/env node
// backpressure-patterns.mjs - shared build/test/lint command detection.
// Not a hook itself — imported by backpressure-tracker (PostToolUse) and
// backpressure-failure-tracker (PostToolUseFailure) so both classify a
// command identically.
//
// classifyVerification(command) -> { isVerification, type, passReliable }
//
// Matching is on the LEADING TOKEN of each shell segment (the command is split
// on && || ; |, each segment trimmed and unwrapped of VAR=val / env / time /
// sudo / npx / bash -c "..." / a leading paren), anchored with (?=\s|$) — NOT a
// raw substring. So `echo "npm test"`, `grep -r "npm test"`, `npx tsc-alias`,
// and `make-release.sh` do NOT match, while `npm test`, `npm t`,
// `CI=1 pnpm test:unit`, `time ./gradlew test`, `python -m pytest`, and
// `cd x && npm run build` do.
//
// passReliable: whether a *success* should be trusted as a passing verification.
// PostToolUse fires when the OVERALL shell exit is 0, which does NOT imply the
// verification command itself passed when its exit is swallowed downstream:
//   `npm test || true`   (||  swallows failure)
//   `npm test; echo ok`  (;   overall exit is the last command's)
//   `npm test | tee log` (|   overall exit is the pipeline tail's, no pipefail)
// So passReliable is true only when every operator AFTER the matched segment is
// `&&` (reaching success then implies the verification passed). Otherwise the
// success tracker must NOT record PASS (leaving status unverified is fail-safe).
// Note: `set -o pipefail` is not detected — pipelines are treated as unreliable.
//
// Failure capture is intentionally LIBERAL (isVerification alone): for a chained
// command like `npm test && deploy` that fails, the failure may be `deploy`, not
// the test — recording FAIL over-blocks, which is fail-safe (the operator re-runs
// a clean verification), so we accept that misattribution rather than miss a real
// test failure.

const VERIFY = [
  ['test',  /^(npm (run )?(t|test)|pnpm (run )?test[\w:.-]*|yarn (run )?test[\w:.-]*|jest|vitest|pytest|python3? -m pytest|node --test|cargo test|go test|mvn test|gradle test|(\.\/)?gradlew test|(\.\/)?mvnw test)(?=\s|$)/],
  ['build', /^(npm run build|pnpm (run )?build[\w:.-]*|yarn (run )?build[\w:.-]*|tsc|make|cargo build|go build|mvn compile|gradle build|(\.\/)?gradlew build|(\.\/)?mvnw compile)(?=\s|$)/],
  ['lint',  /^(npm run lint|pnpm (run )?lint[\w:.-]*|yarn (run )?lint[\w:.-]*|eslint|prettier (--check|-c)|tsc --noEmit|cargo clippy|golangci-lint)(?=\s|$)/],
];

// Peel leading wrappers that don't change which program controls the exit.
function unwrap(seg) {
  let s = seg.trim();
  if (s.startsWith('(')) s = s.replace(/^\(\s*/, '').replace(/\s*\)\s*$/, ''); // (subshell)
  let prev;
  do {
    prev = s;
    s = s.replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)+/, '');  // VAR=val ...
    s = s.replace(/^env\s+(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*/, ''); // env VAR=val ...
    s = s.replace(/^(?:time|sudo|nice|ionice)\s+/, '');
    s = s.replace(/^npx\s+/, '');
    const m = s.match(/^(?:bash|sh)\s+-c\s+(['"])([\s\S]*)\1\s*$/);  // bash -c "..."
    if (m) s = m[2].trim();
  } while (s !== prev);
  return s;
}

function classifySegment(seg) {
  const s = unwrap(seg);
  for (const [type, re] of VERIFY) {
    if (re.test(s)) return type;
  }
  return '';
}

export function classifyVerification(command) {
  if (!command || typeof command !== 'string') {
    return { isVerification: false, type: '', passReliable: false };
  }
  // Split keeping delimiters: [seg, delim, seg, delim, ...]
  const parts = command.split(/(\s*(?:&&|\|\||;|\|)\s*)/);
  let matchIdx = -1;
  let type = '';
  for (let i = 0; i < parts.length; i += 2) {
    const t = classifySegment(parts[i]);
    if (t) { matchIdx = i; type = t; break; }
  }
  if (matchIdx === -1) {
    return { isVerification: false, type: '', passReliable: false };
  }
  // passReliable iff every operator after the matched segment is '&&'.
  let passReliable = true;
  for (let j = matchIdx + 1; j < parts.length; j += 2) {
    if (parts[j].trim() !== '&&') { passReliable = false; break; }
  }
  return { isVerification: true, type, passReliable };
}
