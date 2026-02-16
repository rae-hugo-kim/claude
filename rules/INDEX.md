# INDEX.md (rules)

## Ownership legend

- `owner: global-harness` → enforced by oh-my-claudecode platform/harness.
- `owner: local-policy` → enforced by this repository’s policy docs and review process.

## Conflict resolution order (when global and local diverge)

1. **System/developer/user instructions** (runtime prompt instructions)
2. **Global harness requirements** (`owner: global-harness`)
3. **Repository-local policy** (`owner: local-policy`)
4. **Advisory guidance** (`SHOULD` / `MAY`)

If a local policy conflicts with a global harness rule, follow the global harness rule and document the deviation.

## Core rails

- Safety & security (hard rails): [`safety_security.md`](safety_security.md)
- Anti-hallucination & evidence ladder: [`anti_hallucination.md`](anti_hallucination.md)
- Repo command discovery (never guess commands): [`repo_command_discovery.md`](repo_command_discovery.md)

## Quality rails

- Verification (tests + evals): [`verification_tests_and_evals.md`](verification_tests_and_evals.md)
- Change control (minimal change, scope, Tidy First triggers): [`change_control.md`](change_control.md)
- TDD policy (RED → GREEN → TIDY): [`tdd_policy.md`](tdd_policy.md)

## Tool rails

- MCP server policies (when/how to use): [`mcp_policy.md`](mcp_policy.md)
- Context7 policy (trigger-based): [`context7_policy.md`](context7_policy.md)

## Process rails

- Assetization (spec/decision/retro): [`assetization.md`](assetization.md)
- Commit & PR discipline: [`commit_and_pr.md`](commit_and_pr.md)

## Optional

- Documentation policy (language, README vs INDEX, latest-only option): [`documentation_policy.md`](documentation_policy.md)
