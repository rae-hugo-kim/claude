# CLAUDE.md (Agent Rules - Layered)

This file is **always-on** agent policy. Keep it short.

## Navigation

- Start here, then use indexes:
  - `INDEX.md`
  - `rules/INDEX.md`
  - `checklists/INDEX.md`
  - `templates/INDEX.md`

## Scope

- This policy applies to this repo/workspace when the agent is active.
- If a linked module conflicts with this file, **this file wins**.

## Terminology (RFC 2119)

- **MUST**: required. If you cannot comply, follow the Exception Protocol.
- **SHOULD**: default expectation; may be skipped with a short rationale.
- **MAY**: optional.

## Priority Order (Conflict Resolution)

1) **Safety & Security**
2) **Repo Truth** (lockfiles / manifests / CI / repo docs)
3) **Verification** (tests/evals/replicable steps)
4) **Change Control** (minimal change, scoped diffs)
5) **Maintainability** (readability, tidy refactors)

## Non-Negotiables (MUST)

- **No guessing**: do not invent versions, commands, APIs, or files.
- **Repo commands**: do not guess build/test/lint/typecheck/e2e/eval commands. Discover them.
- **Risky actions**: require explicit approval before proposing/executing risky changes.
- **Verification**: every user-impacting change must include at least one reproducible verification artifact.
- **Evidence**: cite concrete evidence for key decisions (file paths + excerpts or command output).

## Completion Report Contract (MUST)

When you claim a task is “done”, your final message MUST include:

- **Applied rules**: which rules/checklists were applied (links to the relevant docs)
- **Evidence**: concrete evidence for key claims (file paths + excerpts or command outputs)
- **Verification**: what was run/done to verify (commands/results, or deterministic manual steps)

## Default Workflow (MUST)

- **Explore**: read relevant files/config/CI/lockfiles to establish facts. No edits.
- **Plan**: propose a small, verifiable plan with chosen verification.
- **Implement**: minimal change; avoid scope creep.
- **Verify**: run fastest relevant gate first, then full gates if needed.
- **Record**: summarize changes, evidence, verification, risks, and rollback.

## Exception Protocol (MUST when blocked)

If you cannot comply with any MUST:

1) State **why** (what constraint prevents compliance).
2) Provide **2–3 alternatives** (safe options only).
3) Ask for **explicit confirmation** if any alternative is risky or irreversible.

## Context7 Policy (Trigger-based)

- You **MUST** use Context7 when introducing **new** external APIs/SDKs, new dependencies, version-sensitive syntax, or suspected deprecations.
- You **MAY** skip Context7 when modifying code that already demonstrates the same API usage pattern in-repo.

## Linked Modules

- Safety & security: [`rules/safety_security.md`](rules/safety_security.md)
- Anti-hallucination & evidence: [`rules/anti_hallucination.md`](rules/anti_hallucination.md)
- Repo command discovery: [`rules/repo_command_discovery.md`](rules/repo_command_discovery.md)
- Context7 trigger policy: [`rules/context7_policy.md`](rules/context7_policy.md)
- Verification (tests + evals): [`rules/verification_tests_and_evals.md`](rules/verification_tests_and_evals.md)
- Change control (minimal change, scope, tidy): [`rules/change_control.md`](rules/change_control.md)
- Documentation policy (optional): [`rules/documentation_policy.md`](rules/documentation_policy.md)
- Assetization (spec/decision/retro): [`rules/assetization.md`](rules/assetization.md)
- Commit/PR discipline: [`rules/commit_and_pr.md`](rules/commit_and_pr.md)

## Checklists (Use as needed)

- Planning: [`checklists/plan.md`](checklists/plan.md)
- Verification: [`checklists/verify.md`](checklists/verify.md)
- Risky actions: [`checklists/risky_actions.md`](checklists/risky_actions.md)
- Bugfix protocol: [`checklists/bugfix.md`](checklists/bugfix.md)
- PR body: [`checklists/pr.md`](checklists/pr.md)

## Templates

- Assumptions: [`templates/assumptions.md`](templates/assumptions.md)
- Decision log: [`templates/decision_log.md`](templates/decision_log.md)
- PR description: [`templates/pr_body.md`](templates/pr_body.md)
- Retro note: [`templates/retro.md`](templates/retro.md)


