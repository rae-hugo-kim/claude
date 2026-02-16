# Verification: Tests + Evals

## Global enforcement assumed (provided by oh-my-claudecode)

### MUST (owner: global-harness): satisfy harness verification gates before completion

The harness enforces these controls mechanically:
- `acceptance-gate`: Blocks completion claims without passing tests
- `backpressure-gate`: Slows down after repeated failures
- Architect verification is required before completion

This document defines verification *standards*; harness enforces the *process*.

---

## Local additions (this repo only)

### MUST (owner: local-policy): every user-impacting change has a verification artifact

For any user-impacting change, provide at least one reproducible verification artifact:

- A test (unit/integration/e2e), or
- An eval case + harness run, or
- A deterministic manual reproduction procedure (only if automation is not feasible)

## Docs/Policy-Only Change Mode

Use this mode when the diff is limited to **pure markdown/policy navigation/template edits** and has no runtime behavior impact.

### Eligibility (when code tests are not required)

Code tests/evals are **not required** only if all of the following are true:

- Changed files are docs/policy/template content only (`*.md`, checklist/template docs).
- No executable code, configuration, schema, build, or dependency files changed.
- No examples/snippets were changed in a way that claims runtime behavior changes.

If any condition is false, use normal verification gates for code changes.

### Required deterministic artifacts (docs-only)

For docs/policy-only mode, verification MUST include these deterministic artifacts:

1. **Link integrity check**: confirm modified links/anchors resolve (in-repo paths and section anchors).
2. **Cross-reference check**: confirm updated references still point to the canonical source docs.
3. **Rule conflict checklist**: explicitly check for contradictions against `CLAUDE.md` and linked rule files.

### Required evidence format (docs-only PRs)

Docs-only PRs MUST include a short evidence block with:

- **Changed files**: explicit list of edited docs.
- **Before/after intent**: what policy or guidance changed and why.
- **Manual validation steps**: deterministic steps + outcomes for link/cross-reference/conflict checks.

### Risk classification for policy edits

Classify policy edits and route reviews accordingly:

- **Low risk**: wording/clarity changes with no requirement change.
  - Reviewer: any repo maintainer.
- **Medium risk**: changes to verification workflow, checklist gates, or required evidence fields.
  - Mandatory reviewers: at least one policy owner/maintainer **and** one verification owner.
- **High risk**: changes that alter non-negotiables, completion contract semantics, or exception protocol behavior.
  - Mandatory reviewers: policy owner/maintainer, verification owner, **and** project/repo owner.

## SHOULD: prefer the smallest relevant gate first

- Run the fastest relevant check first (single test, smoke subset, small eval, lint/typecheck).
- Then run the broader gate if needed (full suite, full eval) based on risk.

## Guidance: tests vs evals

- Deterministic logic/contracts → **tests**
- Statistical quality, LLM outputs, ranking, UX equivalence, golden diffs → **evals**
- If unsure: start with tests; add evals for quality surfaces

### MUST (owner: local-policy): use evals when correctness is not fully captured by deterministic tests

You MUST (owner: local-policy) add or extend an eval harness/case when the change affects any of:

- Search, ranking, recommendations
- LLM outputs (format adherence, factuality, tone), prompt changes
- UI/visual outputs where pixel/golden diffs matter (screenshots, PDFs, rendered reports)
- Data quality heuristics (normalization, dedupe, labeling)
- Performance baselines (latency/throughput) where regression must be detected

If deterministic tests exist, keep them — evals complement tests, they don’t replace them.

## Examples: “tests are enough” vs “evals are needed”

- Tests are enough:
  - Pure business rule logic (eligibility, fee calculation, state transitions)
  - Parsing/validation with clear contracts
  - Deterministic formatting with strict expected output

- Evals are needed (or strongly preferred):
  - “Top-N results improved” claims
  - “Quality feels better” claims (LLM or ranking)
  - “Visual output looks the same” claims
  - “Performance is stable” claims

## Suggested eval structure (if the repo supports it)

- `eval/cases/` (YAML/JSONL inputs + expected outputs/metrics + notes)
- `eval/harness/` (runner)
- `eval/baselines/` (golden outputs/metrics)
- `eval/reports/` (generated; usually gitignored)

### MUST (owner: local-policy): record what you verified

In the final summary/PR body, include:

- What was run (commands)
- What passed/failed
- Any skipped gates and why
