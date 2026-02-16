# Verification: Tests + Evals

## Global enforcement assumed (provided by oh-my-claudecode)

The harness is assumed to enforce these controls mechanically:
- `acceptance-gate`: Blocks completion claims without passing tests
- `backpressure-gate`: Slows down after repeated failures
- Architect verification is required before completion

## Local additions (this repo only)

### MUST (owner: local-policy): every user-impacting change has a verification artifact

For any user-impacting change, provide at least one reproducible verification artifact:

- A test (unit/integration/e2e), or
- An eval case + harness run, or
- A deterministic manual reproduction procedure (only if automation is not feasible)

### SHOULD: prefer the smallest relevant gate first

- Run the fastest relevant check first (single test, smoke subset, small eval, lint/typecheck).
- Then run the broader gate if needed (full suite, full eval) based on risk.

### Guidance: tests vs evals

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

### Examples: “tests are enough” vs “evals are needed”

- Tests are enough:
  - Pure business rule logic (eligibility, fee calculation, state transitions)
  - Parsing/validation with clear contracts
  - Deterministic formatting with strict expected output

- Evals are needed (or strongly preferred):
  - “Top-N results improved” claims
  - “Quality feels better” claims (LLM or ranking)
  - “Visual output looks the same” claims
  - “Performance is stable” claims

### Suggested eval structure (if the repo supports it)

- `eval/cases/` (YAML/JSONL inputs + expected outputs/metrics + notes)
- `eval/harness/` (runner)
- `eval/baselines/` (golden outputs/metrics)
- `eval/reports/` (generated; usually gitignored)

### MUST (owner: local-policy): record what you verified

In the final summary/PR body, include:

- What was run (commands)
- What passed/failed
- Any skipped gates and why
