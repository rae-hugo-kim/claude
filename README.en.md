**[한국어](README.md)**

# claude — Claude Code Harness Template

A policy framework that makes Claude Code behave consistently and safely.

Clone this repo and you get rules, checklists, skills, and hooks as a single package.
Delete what you don't need. Adapt the rest to your project.

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- [oh-my-claudecode](https://github.com/yeachan-heo/oh-my-claudecode) (OMC)

Without OMC, core features like agent delegation and hook automation won't work.

## Getting Started

### 1. Set Up Environment (once per machine)

```bash
/bootstrap
```

Installs OMC, RTK, general-purpose MCP servers (context7, serena, exa, browser-tools), and docs viewer tooling (mdBook + mdbook-mermaid + mmdc).
Optionally add supabase, react-design-systems, and more.

### 2. Create a Project

```bash
/init my-project          # public
/init my-project --private # private
```

Creates a new GitHub repository based on this template.

### 3. Start Building

```
/brainstorm  →  (optional) divergent thinking; verbatim trail auto-saved to docs/brainstorming/
/kickoff     →  Define scope (goals, constraints, AC) — picks up brainstorm capture if present
/startdev    →  TDD-driven implementation
/compr       →  Create a pull request
```

## Structure

```
.
├── CLAUDE.md              Agent policy entry point
├── rules/                 Behavior rules
│   ├── safety_security    Safety & security
│   ├── anti_hallucination Evidence-based behavior
│   ├── change_control     Minimal change principle
│   ├── tdd_policy         RED → GREEN → TIDY
│   ├── doc_standards      Markdown SST + Mermaid standards
│   ├── ...                Each file has a one-line description
│   └── INDEX.md           Full listing
├── checklists/            Task checklists
├── templates/             Reusable templates
├── .claude/
│   ├── skills/            Skill definitions
│   │   ├── bootstrap/             Environment setup (incl. docs tooling)
│   │   ├── init/                  Project creation
│   │   ├── brainstorm/            Divergent-thinking mode with verbatim capture
│   │   ├── kickoff/               Scope interview (auto-picks brainstorm capture)
│   │   ├── startdev/              TDD implementation
│   │   ├── compr/                 PR creation
│   │   ├── compush/               Commit + push
│   │   ├── sum/                   Session summary
│   │   ├── tidy/                  Refactoring
│   │   ├── code-review/           Code review (3-pass)
│   │   ├── receiving-code-review/ Review intake guide
│   │   ├── harness-check/         Harness drift check + sync + audit
│   │   ├── design-mockup/         Interactive HTML mockup generator
│   │   └── grepai-search/         Semantic code search
│   ├── hooks/harness/     Harness hooks
│   └── settings.json      Hook registration
├── docs/
│   ├── SUMMARY.md         mdBook viewer index
│   ├── README.md          Viewer landing
│   ├── brainstorming/     Divergent-thinking captures (gitignored)
│   └── harness/           Harness runtime files
├── book.toml              mdBook config (mermaid preprocessor)
├── scripts/docs-build.sh  Docs build + Mermaid syntax validation
├── artifacts/             One-off human-facing HTML (gitignored)
└── claudedocs/            Reference docs
```

## Skills

| Command | What it does |
|---------|-------------|
| `/bootstrap` | Set up dev environment (OMC + RTK + MCP servers + docs tooling) |
| `/init <name>` | Create new project from this template |
| `/brainstorm [topic]` | Divergent-thinking mode; verbatim capture to `docs/brainstorming/`. Triggers: "brainstorm", "발산", "같이 생각해", "사고 확장" |
| `/kickoff` | Define goals, constraints, acceptance criteria (uses brainstorm capture as soft context if present) |
| `/startdev` | Start TDD implementation from seed.yaml |
| `/sum` | Save session summary to `docs/sum/` |
| `/compr` | Branch → commit → push → PR |
| `/compush` | Commit → push (no PR) |
| `/tidy` | Refactor with Kent Beck's Tidy First |
| `/code-review` | 3-pass adversarial review of pending changes |
| `/receiving-code-review` | Verify and apply review feedback |
| `/harness-check` | Check harness drift and auto-sync from the source remote (`--audit` for 7-category quality score) |
| `/design-mockup` | Generate a single-file HTML mockup with sliders/knobs for design parameter tuning (`artifacts/design/`) |
| `/grepai-search` | Semantic code search for cold-start orientation |

## Harness

Automated guardrails that activate during the kickoff → startdev flow:

- **seed.yaml** — Structured kickoff output (goals, constraints, AC, risks). If a brainstorm capture was adopted, its path lands in `references`
- **scope-gate hook** — Blocks edits to out-of-scope paths
- **context-gate + read-tracker hooks** — Prevents editing unread files
- **acceptance-gate hook** — Blocks commits with unmet acceptance criteria
- **backpressure hooks** — Suppresses commits without verification (gate + tracker + invalidator)
- **kickoff-detector hook** — Reminds to kickoff when new work is detected
- **mcp-gate hook** — Enforces MCP server usage policy
- **destructive-guard hook** — Blocks dangerous commands (rm -rf, force push, etc.)
- **risk-assess hook** — Auto-assesses change impact
- **review-gate hook** — Forces review when risk threshold is crossed
- **harness-version-check hook** — Notifies of remote harness drift on SessionStart
- **rubric** — 4-dimension clarity gate (HIGH/MED/LOW)
- **audit log** — Event tracking (append-only JSONL). `brainstorm_referenced` event recorded when a brainstorm capture is adopted
- **glossary** — Project terminology alignment (`docs/glossary.yaml`)

## Harness Version Management

This repository serves as the **harness source** that other projects sync from.

### This repo (source) — automatic version bump

When `rules/`, `checklists/`, `.claude/`, `CLAUDE.md`, etc. change, `harness-meta.json` is bumped and a `harness/YYYY.N` tag is created. Activate the hook once after cloning:

```bash
git config core.hooksPath .githooks
```

After that, `git commit` automatically calls `scripts/harness-version-bump.sh`. Commits that touch only non-harness files are left alone.

### Other projects (consumer) — `/harness-check`

Projects created with `/init` or `/bootstrap` get a SessionStart hook that checks the remote harness tag every 24 hours and reports drift. To explicitly sync:

```bash
/harness-check              # overwrite-sync to the latest harness/* tag
/harness-check --dry-run    # preview the paths that would be overwritten
/harness-check --audit      # after sync, print 7-category (0–70) quality score
```

`--audit` invokes `scripts/harness-audit.sh` and scores tool_coverage, context_efficiency, quality_gates, memory_persistence, eval_coverage, security_guardrails, cost_efficiency.

## Docs Viewer (mdBook)

Local viewer that renders the Markdown SST as a human-friendly HTML site. Each project serves its own `docs/` independently.

```bash
bash scripts/docs-build.sh   # build to book/ + validate Mermaid syntax (mmdc)
mdbook serve                 # http://127.0.0.1:3000 with hot reload
```

- **Config**: `book.toml` points to `src = "docs"`. mdbook-mermaid preprocessor is registered.
- **Index**: documents are auto-indexed into `docs/SUMMARY.md` (section whitelist + `git ls-files`). Drop a new `.md` into a whitelisted section and the next build registers it in the sidebar. Untracked `.md` files emit a stderr WARN.
- **Validation**: `docs-build.sh` extracts every ```` ```mermaid ```` block from `*.md` and validates with `mmdc` — broken diagrams fail the build.
- **Authoring standards**: [`rules/doc_standards.md`](rules/doc_standards.md) — Mermaid default, 200+ line summary, GFM tables, `artifacts/` isolation, uppercase `SKILL.md`.
- **artifacts/**: one-off human-facing HTML (mockups, explainers, design previews) lives here. `artifacts/**` is gitignored, but `artifacts/**/README.md` is excepted and tracked.
- **Local-only archives**: `docs/brainstorming/`, `docs/sum/`, `docs/reviews/` are gitignored and intentionally not indexed by the viewer.
- **Port conflicts**: to serve multiple projects simultaneously, use `mdbook serve --port 3001`.

The toolchain (mdbook, mdbook-mermaid, mmdc) is installed automatically by `/bootstrap` Phase 3.

## Customizing Rules

Each file under `rules/` is an independent rule.
Delete the ones you don't need — the rest keeps working.

| Category | Rules |
|----------|-------|
| **Safety** | safety_security, agent_security, anti_hallucination, repo_command_discovery |
| **Quality** | coding_standards, verification_tests_and_evals, change_control, tdd_policy, code_review_policy, quality_gates |
| **Tools** | mcp_policy, context7_policy, hook_recipes |
| **Process** | assetization, commit_and_pr, harness_integration_contract |
| **Docs** | documentation_policy, doc_standards |
| **Operations** | context_management, session_persistence, cost_awareness, learning_policy |

## Core Principles

1. **Think Before Coding** — State assumptions explicitly; ask when uncertain
2. **Simplicity First** — Build only what's requested; no over-engineering
3. **Surgical Changes** — Edit only relevant code; match existing style
4. **Goal-Driven Execution** — Turn vague requests into verifiable objectives

## License

See repository for license details.
