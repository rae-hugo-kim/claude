#!/usr/bin/env node
// backpressure-patterns.mjs - shared build/test/lint command detection.
// Not a hook itself — imported by backpressure-tracker (PostToolUse) and
// backpressure-failure-tracker (PostToolUseFailure) so both classify a
// command identically.
//
// classifyVerification(command) -> { isVerification, type, passReliable }
//
// The command is split into top-level shell segments by a QUOTE-AWARE scanner
// (splitTopLevel): operators && || ; | & inside single/double quotes or after a
// backslash are NOT treated as delimiters. Each segment is then trimmed and
// unwrapped of VAR=val / env / time / sudo / nice / npx / bash -c "..." /
// a leading (subshell), and matched on its LEADING TOKEN anchored with (?=\s|$)
// — never a raw substring. So `echo "x; npm test && ok"`, `grep "npm test" f`,
// `npx tsc-alias`, and `make-release.sh` do NOT match, while `npm test`,
// `npm t`, `CI=1 pnpm test:unit`, `time ./gradlew test`, `python -m pytest`,
// and `cd x && npm run build` do.
//
// passReliable: whether a *success* should be trusted as a passing verification.
// PostToolUse fires when the OVERALL shell exit is 0, which does NOT imply the
// verification command itself passed when its exit is swallowed downstream:
//   `npm test || true`   (|| swallows failure)
//   `npm test; echo ok`  (;  overall exit is the last command's)
//   `npm test | tee log` (|  pipeline tail's exit, no pipefail)
//   `npm test &`         (&  backgrounded; shell returns 0 immediately)
// passReliable is true only when every operator AFTER the matched segment is
// `&&` (reaching success then implies the verification passed). Otherwise the
// success tracker must NOT record PASS (leaving status unverified is fail-safe).
// Not handled (treated as unreliable / fail-safe): `set -o pipefail`, and a
// verification reached only via command substitution.
//
// Failure capture is intentionally LIBERAL (isVerification alone): for a chained
// `npm test && deploy` that fails, the failure may be `deploy`, not the test —
// recording FAIL over-blocks, which is fail-safe (operator re-runs a clean
// verification), so we accept that misattribution rather than miss a real failure.

const VERIFY = [
  // order matters: lint before build so `tsc --noEmit` labels as lint, not build.
  ['test',  /^(npm (run )?(t|test)|pnpm (run )?test[\w:.-]*|yarn (run )?test[\w:.-]*|jest|vitest|pytest|python3? -m pytest|node --test|cargo test|go test|mvn test|gradle test|(\.\/)?gradlew test|(\.\/)?mvnw test)(?=\s|$)/],
  ['lint',  /^(npm run lint|pnpm (run )?lint[\w:.-]*|yarn (run )?lint[\w:.-]*|eslint|prettier (--check|-c)|tsc --noEmit|cargo clippy|golangci-lint)(?=\s|$)/],
  ['build', /^(npm run build|pnpm (run )?build[\w:.-]*|yarn (run )?build[\w:.-]*|tsc|make|cargo build|go build|mvn compile|gradle build|(\.\/)?gradlew build|(\.\/)?mvnw compile)(?=\s|$)/],
];

// Quote-aware split into top-level segments + the operators between them.
// Returns { segs, ops } with ops.length === segs.length - 1; ops[i] is the
// operator between segs[i] and segs[i+1] (one of && || ; | &).
function splitTopLevel(cmd) {
  const segs = [], ops = [];
  let cur = '', i = 0, q = null; // q = "'" or '"' while inside that quote
  while (i < cmd.length) {
    const c = cmd[i], n = cmd[i + 1];
    if (q === "'") { cur += c; if (c === "'") q = null; i++; continue; }
    if (q === '"') {
      if (c === '\\' && n !== undefined) { cur += c + n; i += 2; continue; }
      cur += c; if (c === '"') q = null; i++; continue;
    }
    if (c === "'" || c === '"') { q = c; cur += c; i++; continue; }
    if (c === '\\' && n !== undefined) { cur += c + n; i += 2; continue; }
    if (c === '&' && n === '&') { segs.push(cur); ops.push('&&'); cur = ''; i += 2; continue; }
    if (c === '|' && n === '|') { segs.push(cur); ops.push('||'); cur = ''; i += 2; continue; }
    if (c === ';') { segs.push(cur); ops.push(';'); cur = ''; i++; continue; }
    if (c === '|') { segs.push(cur); ops.push('|'); cur = ''; i++; continue; }
    if (c === '&') { segs.push(cur); ops.push('&'); cur = ''; i++; continue; }
    cur += c; i++;
  }
  segs.push(cur);
  return { segs, ops };
}

// Peel leading wrappers that don't change which program controls the exit.
function unwrap(seg) {
  let s = seg.trim();
  if (s.startsWith('(')) s = s.replace(/^\(\s*/, '').replace(/\s*\)\s*$/, ''); // (subshell)
  let prev;
  do {
    prev = s;
    s = s.replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)+/, '');       // VAR=val ...
    s = s.replace(/^env\s+(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*/, ''); // env VAR=val ...
    s = s.replace(/^(?:time|sudo|nice|ionice)\s+/, '');
    s = s.replace(/^npx\s+/, '');
    const m = s.match(/^(?:bash|sh)\s+-c\s+(['"])([\s\S]*)\1\s*$/); // bash -c "..."
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
  const { segs, ops } = splitTopLevel(command);
  let matchIdx = -1, type = '';
  for (let i = 0; i < segs.length; i++) {
    const t = classifySegment(segs[i]);
    if (t) { matchIdx = i; type = t; break; }
  }
  if (matchIdx === -1) {
    return { isVerification: false, type: '', passReliable: false };
  }
  // Operators after the matched segment are ops[matchIdx..]. Reliable iff all '&&'.
  let passReliable = true;
  for (let j = matchIdx; j < ops.length; j++) {
    if (ops[j] !== '&&') { passReliable = false; break; }
  }
  return { isVerification: true, type, passReliable };
}
