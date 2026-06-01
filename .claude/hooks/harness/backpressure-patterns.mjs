#!/usr/bin/env node
// backpressure-patterns.mjs - shared build/test/lint command detection.
// Not a hook itself — imported by backpressure-tracker (PostToolUse) and
// backpressure-failure-tracker (PostToolUseFailure) so both classify a
// command identically.
//
// Matches the LEADING token of each shell segment (the command is split on
// && || ; | and each segment trimmed), after stripping leading `VAR=val` and
// `npx` prefixes — NOT a raw substring. So `echo "npm test"` and
// `grep -r "npm test" docs/` do NOT match, while `npm test`, `CI=1 pnpm test`,
// and `cd x && npm run build` do.
//
// Known limitation: a command whose OVERALL shell exit is 0 despite an inner
// failure (e.g. `npm test || true`, `npm test; echo done`) still classifies as
// a passing verification under PostToolUse — that signal is unrecoverable from
// PostToolUse alone (the tool succeeded). Real failures of a bare verification
// command route to PostToolUseFailure and are caught there.

const VERIFY = [
  ['test',  /^(npm (run )?test|pnpm (run )?test|yarn test|pytest|jest|vitest|cargo test|go test|mvn test|gradle test)\b/],
  ['build', /^(npm run build|pnpm (run )?build|yarn build|tsc|make|cargo build|go build|mvn compile|gradle build)\b/],
  ['lint',  /^(npm run lint|pnpm (run )?lint|yarn lint|eslint|prettier|cargo clippy|golangci-lint)\b/],
];

export function classifyVerification(command) {
  if (!command || typeof command !== 'string') {
    return { isVerification: false, type: '' };
  }
  for (let seg of command.split(/&&|\|\||;|\|/)) {
    seg = seg
      .trim()
      .replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)+/, '') // leading VAR=val ...
      .replace(/^npx\s+/, '');                            // leading npx
    for (const [type, re] of VERIFY) {
      if (re.test(seg)) return { isVerification: true, type };
    }
  }
  return { isVerification: false, type: '' };
}
