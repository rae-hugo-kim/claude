**[English](README.en.md)**

# claude — Claude Code 하네스 템플릿

Claude Code가 일관되고 안전하게 동작하도록 만드는 정책 프레임워크입니다.

이 저장소를 복사하면 규칙, 체크리스트, 스킬, 훅이 한 세트로 적용됩니다.
필요 없는 건 지우고, 프로젝트에 맞게 고쳐 쓰세요.

## 필요한 것

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- [oh-my-claudecode](https://github.com/yeachan-heo/oh-my-claudecode) (OMC)

OMC가 없으면 에이전트 위임, 훅 자동화 등 핵심 기능이 빠집니다.

## 시작하기

### 1. 환경 구축 (머신당 1회)

```bash
/bootstrap
```

OMC, RTK, 범용 MCP 서버(context7, serena, exa, browser-tools), docs 뷰어 도구(mdBook + mdbook-mermaid + mmdc)를 설치합니다.
선택적으로 supabase, react-design-systems 등을 추가할 수 있습니다.

### 2. 프로젝트 생성

```bash
/init my-project          # public
/init my-project --private # private
```

이 템플릿을 기반으로 새 GitHub 저장소를 만듭니다.

### 3. 개발 시작

```
/brainstorm  →  (선택) 사고 발산, 캡처는 docs/brainstorming/에 자동 저장
/kickoff     →  스코프 정의 (목표, 제약, 수락 기준) — brainstorm 캡처 있으면 자동 인식
/startdev    →  TDD 기반 구현
/compr       →  PR 생성
```

## 구조

```
.
├── CLAUDE.md              에이전트 정책 진입점
├── rules/                 행동 규칙
│   ├── safety_security    안전/보안
│   ├── anti_hallucination 증거 기반 동작
│   ├── change_control     최소 변경 원칙
│   ├── tdd_policy         RED → GREEN → TIDY
│   ├── doc_standards      마크다운 SST + Mermaid 표준
│   ├── ...                각 파일에 한 줄 설명 포함
│   └── INDEX.md           전체 목록
├── checklists/            작업별 체크리스트
├── templates/             재사용 템플릿
├── .claude/
│   ├── skills/            스킬 정의
│   │   ├── bootstrap/         환경 구축 (docs 도구 포함)
│   │   ├── init/              프로젝트 생성
│   │   ├── brainstorm/        사고 발산 + 캡처 모드
│   │   ├── kickoff/           스코프 인터뷰 (brainstorm 자동 인식)
│   │   ├── startdev/          TDD 구현
│   │   ├── compr/             PR 생성
│   │   ├── compush/           커밋+푸시
│   │   ├── sum/               세션 요약
│   │   ├── tidy/              리팩토링
│   │   ├── code-review/       코드 리뷰 (3-pass)
│   │   ├── receiving-code-review/  리뷰 수용 가이드
│   │   ├── harness-check/     하네스 드리프트 체크 + sync + audit
│   │   ├── design-mockup/     인터랙티브 HTML mockup 생성
│   │   └── grepai-search/     시맨틱 코드 검색
│   ├── hooks/harness/     하네스 훅
│   └── settings.json      훅 등록 설정
├── docs/
│   ├── SUMMARY.md         mdBook 뷰어 인덱스
│   ├── README.md          뷰어 랜딩
│   ├── brainstorming/     발산 캡처 (gitignored)
│   └── harness/           하네스 런타임 파일
├── book.toml              mdBook 설정 (mermaid preprocessor)
├── scripts/docs-build.sh  docs 빌드 + Mermaid syntax 검증
├── artifacts/             1회성 사람용 HTML 격리 (gitignored)
└── claudedocs/            참조 문서
```

## 스킬

| 명령어 | 하는 일 |
|--------|---------|
| `/bootstrap` | 개발 환경 구축 (OMC + RTK + MCP 서버 + docs 도구) |
| `/init <name>` | 이 템플릿에서 새 프로젝트 생성 |
| `/brainstorm [주제]` | 사고 발산 모드. `docs/brainstorming/`에 verbatim 캡처. 트리거: "브레인스토밍", "발산", "같이 생각해", "사고 확장" |
| `/kickoff` | 목표, 제약, 수락 기준 정의 (있으면 brainstorm 캡처를 soft context로 활용) |
| `/startdev` | seed.yaml 기반 TDD 구현 시작 |
| `/sum` | 현재 세션을 `docs/sum/`에 요약 저장 |
| `/compr` | 브랜치 → 커밋 → 푸시 → PR |
| `/compush` | 커밋 → 푸시 (PR 없이) |
| `/tidy` | Kent Beck의 Tidy First 리팩토링 |
| `/code-review` | 변경 사항 3-pass 적대적 리뷰 |
| `/receiving-code-review` | 받은 리뷰 의견 검증·반영 |
| `/harness-check` | 하네스 버전 드리프트 체크 + 원격에서 자동 sync (`--audit`로 7-카테고리 품질 점수) |
| `/design-mockup` | 슬라이더/노브로 파라미터 튜닝 가능한 단일 HTML mockup 생성 (`artifacts/design/`) |
| `/grepai-search` | 의미 기반 코드 검색 (콜드스타트 탐색) |

## 하네스

kickoff → startdev 흐름에서 자동으로 작동하는 장치들:

- **seed.yaml** — 킥오프 결과를 구조화 (목표, 제약, 수락 기준, 리스크). brainstorm 캡처를 사용했다면 `references`에 경로 자동 추가
- **context-gate + read-tracker 훅** — 읽지 않은 파일 수정 방지
- **acceptance-gate 훅** — 수락 기준 미충족 시 커밋 차단
- **backpressure 훅** — 검증 없는 커밋 억제 (gate + tracker + invalidator)
- **kickoff-detector 훅** — 새 작업 감지 시 킥오프 리마인더
- **mcp-gate 훅** — MCP 서버 사용 정책 강제
- **destructive-guard 훅** — 위험한 명령(rm -rf, 강제 푸시 등) 차단
- **risk-assess 훅** — 변경 영향도 자동 평가
- **review-gate 훅** — 리스크 임계 초과 시 리뷰 강제
- **harness-version-check 훅** — SessionStart 시 원격 하네스 드리프트 알림
- **rubric** — 4차원 명확도 게이트 (HIGH/MED/LOW)
- **audit log** — 이벤트 추적 (append-only JSONL). brainstorm 채택 시 `brainstorm_referenced` 이벤트 기록
- **glossary** — 프로젝트 용어 정의 (`docs/glossary.yaml`)

## 하네스 버전 관리

이 저장소는 다른 프로젝트들이 동기화 대상으로 삼는 **하네스 원본**입니다.

### 이 저장소 (source) — 버전 bump (의도적 1회)

`rules/`, `checklists/`, `.claude/`, `CLAUDE.md`, `scripts/harness-*.sh`, `templates/` 등 하네스 자산 변경이 main에 머지되면, **머지 후 한 번** 버전을 올립니다:

```bash
bash scripts/harness-version-bump.sh --dry-run   # 무엇이 .N+1로 올라갈지 미리 보기
bash scripts/harness-version-bump.sh             # 마지막 harness/* 태그 이후 변경분에 대해 1회 bump + 태그
git push --follow-tags
```

마지막 `harness/*` 태그 이후 하네스 자산이 바뀐 경우에만 1회 올라가며(멱등 — 변경 없으면 no-op), 한 기능에 커밋이 여러 개여도 버전은 하나입니다. (예전엔 post-commit 훅이 커밋마다 자동 bump해 한 기능에 버전이 여러 개 생기는 churn이 있었습니다. `.githooks/post-commit`은 이제 no-op stub입니다.)

### 다른 프로젝트 (consumer) — `/harness-check`

`/init` 또는 `/bootstrap`으로 만든 프로젝트는 SessionStart 훅이 24시간마다 원격 하네스 태그를 확인하고 드리프트가 있으면 알립니다. 명시적으로 동기화하려면:

```bash
/harness-check              # 최신 harness/* 태그로 덮어쓰기 sync
/harness-check --dry-run    # 변경될 경로만 미리 보기
/harness-check --audit      # sync 후 7-카테고리(0~70) 품질 점수 출력
```

`--audit`은 `scripts/harness-audit.sh`를 호출해 tool_coverage, context_efficiency, quality_gates, memory_persistence, eval_coverage, security_guardrails, cost_efficiency를 점수화합니다.

### Audit history (issue #11)

`scripts/harness-version-bump.sh`로 버전을 올릴 때마다 audit 결과가 `.omc/state/harness-scores.jsonl`에 한 줄씩 누적됩니다. 시리즈는 `rubric_version` 필드로 구분되어, 채점 룰이 바뀌면 이전 시리즈와 분리됩니다.

**rubric_version bump workflow** (채점 룰 변경 시):
1. `scripts/harness-audit.sh` 상단의 `RUBRIC_VERSION` 상수를 1 증가
2. 같은 커밋에서 룰 변경(카테고리 추가/임계값 시프트/가중치 변경) 반영
3. 다음 harness 태그 발사 시 새 시리즈가 시작됨

소비자는 `bash scripts/harness-audit.sh --rubric-version`으로 현재 버전을 읽을 수 있습니다.

## Docs 뷰어 (mdBook)

마크다운(SST)을 사람 친화적 HTML로 렌더링하는 로컬 뷰어. 각 프로젝트가 자기 `docs/`를 독립적으로 serve합니다.

```bash
bash scripts/docs-build.sh   # book/에 정적 사이트 빌드 + Mermaid syntax 검증 (mmdc)
mdbook serve                 # http://127.0.0.1:3000 hot reload
```

- **설정**: `book.toml`이 `src = "docs"`를 가리킴. mdbook-mermaid preprocessor 등록.
- **인덱스**: 뷰어에 노출할 문서는 `docs/SUMMARY.md`에 자동 인덱싱 (화이트리스트 섹션 + `git ls-files` 기반). 새 `.md`를 화이트리스트 디렉터리에 추가하면 빌드 한 번으로 사이드바에 등장. untracked `.md`는 stderr WARN으로 안내.
- **검증**: `docs-build.sh`가 모든 `*.md`에서 ```` ```mermaid ```` 블록을 추출해 `mmdc`로 syntax 검증 — 깨진 다이어그램은 빌드 실패.
- **작성 표준**: [`rules/doc_standards.md`](rules/doc_standards.md) — Mermaid 기본, 200줄+ 요약, GFM 표, `artifacts/` 격리, SKILL.md 대문자.
- **artifacts/**: 1회성 사람용 HTML(mockup·explainer·design preview)은 여기로. `artifacts/**`는 gitignored지만 `artifacts/**/README.md`는 예외로 추적.
- **로컬 전용 아카이브**: `docs/brainstorming/`, `docs/sum/`, `docs/reviews/`는 gitignored이며 SUMMARY 인덱싱 대상이 아님 (의도).
- **포트 충돌**: 여러 프로젝트를 동시에 serve하려면 `mdbook serve --port 3001`.

도구(mdbook, mdbook-mermaid, mmdc)는 `/bootstrap` Phase 3에서 자동 설치됩니다.

## 규칙 커스터마이징

`rules/` 아래 각 파일이 독립된 규칙입니다.
필요 없는 파일은 삭제하세요 — 나머지는 그대로 동작합니다.

| 분류 | 포함 규칙 |
|------|----------|
| **안전** | safety_security, agent_security, anti_hallucination, repo_command_discovery |
| **품질** | coding_standards, verification_tests_and_evals, change_control, tdd_policy, code_review_policy, quality_gates |
| **도구** | mcp_policy, context7_policy, hook_recipes |
| **프로세스** | assetization, commit_and_pr, harness_integration_contract |
| **문서** | documentation_policy, doc_standards |
| **운영** | context_management, session_persistence, cost_awareness, learning_policy |

## 핵심 원칙

1. **코딩 전에 생각하기** — 가정을 명시하고, 불확실하면 질문
2. **단순함 우선** — 요청된 것만 구현, 과도한 설계 금지
3. **외과적 변경** — 관련 코드만 수정, 기존 스타일 유지
4. **목표 중심 실행** — 모호한 요청을 검증 가능한 목표로 전환

## 라이선스

저장소 라이선스를 확인하세요.
