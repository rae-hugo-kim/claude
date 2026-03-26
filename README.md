# claude — Claude Code Policy Template Repository

A template repository providing `CLAUDE.md` and a structured policy framework for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) projects. Built for use with [oh-my-claudecode](https://github.com/anthropics/oh-my-claudecode).

## Quick Start

```bash
# Clone into your project
git clone https://github.com/rae-hugo-kim/claude.git

# Or use as a GitHub template
# Click "Use this template" on the repository page
```

## Structure

```
.
├── CLAUDE.md            # Main agent policy (entry point)
├── INDEX.md             # Repository navigation index
├── EXAMPLES.md          # Principle examples with good/bad patterns
├── rules/               # Rule definitions for agent behavior
├── checklists/          # Task & review checklists
├── templates/           # Reusable project templates
├── claudedocs/          # Supporting docs (Korean translation, bootstrap guide, agreements)
└── .omc/                # oh-my-claudecode configuration
```

## How to Deploy

1. **With `/init` skill** (recommended):
   ```bash
   /init my-new-project          # public repo
   /init my-new-project --private # private repo
   ```
2. **With gh CLI**:
   ```bash
   gh repo create my-new-project --template rae-hugo-kim/claude --clone
   ```
3. **Copy into existing project**: Copy `CLAUDE.md` and the directories you need into your project root.

Claude Code will automatically read `CLAUDE.md` from the project root when you start a session.

## Skills

| Skill | Command | Purpose |
|-------|---------|---------|
| **init** | `/init <name>` | Create new project from this template |
| **kickoff** | `/kickoff` | Project/feature scope interview (JTBD → Scope → AC) |
| **startdev** | `/startdev` | TDD-gated implementation with seed.yaml |
| **sum** | `/sum` | Save session summary to `docs/sum/` |
| **compr** | `/compr` | Create branch, commit, push, and open PR |
| **compush** | `/compush` | Auto commit and push |
| **tidy** | `/tidy` | Refactor with Kent Beck's Tidy First |

### Workflow

```
/init my-project → /kickoff → /startdev → /compr
```

## Harness

The kickoff → startdev workflow is powered by a harness system:

- **seed.yaml** — Structured kickoff output (goal, constraints, AC, risks)
- **Rubric** — 4-dimension clarity gate (HIGH/MED/LOW)
- **Audit log** — Append-only JSONL event trail
- **scope-gate** hook — Blocks edits to out-of-scope paths
- **acceptance-gate** hook — Blocks commits with unmet AC
- **Glossary** — Project terminology alignment (`docs/glossary.yaml`)

## Core Principles

- **Think Before Coding** — State assumptions explicitly, ask before deciding
- **Simplicity First** — Implement only what's requested, avoid over-engineering
- **Surgical Changes** — Edit only relevant lines, match existing style
- **Goal-Driven Execution** — Transform vague requests into verifiable objectives

## License

See repository for license details.

---

# claude — Claude Code 정책 템플릿 저장소

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) 프로젝트를 위한 `CLAUDE.md` 및 구조화된 정책 프레임워크 템플릿입니다. [oh-my-claudecode](https://github.com/anthropics/oh-my-claudecode) 환경에서 사용할 수 있습니다.

## 빠른 시작

```bash
# 프로젝트에 클론
git clone https://github.com/rae-hugo-kim/claude.git

# 또는 GitHub 템플릿으로 사용
# 저장소 페이지에서 "Use this template" 클릭
```

## 구조

```
.
├── CLAUDE.md            # 메인 에이전트 정책 (진입점)
├── INDEX.md             # 저장소 탐색 인덱스
├── EXAMPLES.md          # 원칙별 좋은/나쁜 패턴 예시
├── rules/               # 에이전트 행동 규칙 정의
├── checklists/          # 작업 및 리뷰 체크리스트
├── templates/           # 재사용 가능한 프로젝트 템플릿
├── claudedocs/          # 보조 문서 (한국어 번역, 부트스트랩 가이드, 합의사항)
└── .omc/                # oh-my-claudecode 설정
```

## 배포 방법

1. **`/init` 스킬 사용** (권장):
   ```bash
   /init my-new-project          # public repo
   /init my-new-project --private # private repo
   ```
2. **gh CLI 사용**:
   ```bash
   gh repo create my-new-project --template rae-hugo-kim/claude --clone
   ```
3. **기존 프로젝트에 복사**: `CLAUDE.md`와 필요한 디렉토리를 프로젝트 루트에 복사합니다.

Claude Code는 세션 시작 시 프로젝트 루트의 `CLAUDE.md`를 자동으로 읽습니다.

## 스킬

| 스킬 | 명령어 | 용도 |
|------|--------|------|
| **init** | `/init <이름>` | 이 템플릿에서 새 프로젝트 생성 |
| **kickoff** | `/kickoff` | 프로젝트/기능 스코프 인터뷰 (JTBD → Scope → AC) |
| **startdev** | `/startdev` | seed.yaml 기반 TDD 구현 시작 |
| **sum** | `/sum` | 세션 요약을 `docs/sum/`에 저장 |
| **compr** | `/compr` | 브랜치 생성, 커밋, 푸시, PR 오픈 |
| **compush** | `/compush` | 자동 커밋 및 푸시 |
| **tidy** | `/tidy` | Kent Beck의 Tidy First 리팩토링 |

### 워크플로우

```
/init my-project → /kickoff → /startdev → /compr
```

## 하네스

kickoff → startdev 워크플로우는 하네스 시스템으로 구동됩니다:

- **seed.yaml** — 구조화된 킥오프 산출물 (goal, constraints, AC, risks)
- **Rubric** — 4차원 명확도 게이트 (HIGH/MED/LOW)
- **Audit log** — Append-only JSONL 이벤트 기록
- **scope-gate** 훅 — out_of_scope 경로 편집 차단
- **acceptance-gate** 훅 — 수락 기준 미충족 시 커밋 차단
- **Glossary** — 프로젝트 용어 정렬 (`docs/glossary.yaml`)

## 핵심 원칙

- **코딩 전에 생각하기** — 가정을 명시적으로 밝히고, 결정 전에 질문하기
- **단순함 우선** — 요청된 것만 구현하고, 과도한 설계 지양
- **외과적 변경** — 관련 라인만 수정하고, 기존 스타일 유지
- **목표 중심 실행** — 모호한 요청을 검증 가능한 목표로 변환
