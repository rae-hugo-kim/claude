<!-- policy-sync-warning:start -->
warning_type: reference_only
non_normative_reference_only: true
last_sync_date: 2026-02-16
source_of_truth: ../CLAUDE.md
source_commit_hash: 03e12a011a5c49411b6e6585e53768e9a02e265f
<!-- policy-sync-warning:end -->

# CLAUDE.md (Team Standard)
이 파일은 항상 로드됩니다. 여러 레포에서 공용으로 사용합니다.
핵심은 “추측 금지 + 짧은 검증 루프 + 자산화(스펙/회고/평가셋)”입니다.

---

## 0) 운영 계약 (필수)

### 목표
가장 적은 리스크로 올바른 변경을 배포한다. 이를 위해 **검증 가능한 루프**를 최우선으로 한다.

### 기본 워크플로우 (항상)
1) **Explore(탐색)**: 관련 파일/설정/CI/락파일을 읽고 사실을 확보한다. 이 단계에서 코드 수정 금지.
2) **Plan(계획)**: 작고 검증 가능한 변경 계획을 제시한다(테스트/평가 포함).
3) **Implement(구현)**: 최소 변경으로 구현한다.
4) **Verify(검증)**: 빠른 검증 → 필요 시 전체 게이트 순으로 실행한다.
5) **Commit/PR(기록)**: 작은 단위로 커밋하고, 결정/가정/회고를 남긴다.

### Reference doc sync (MUST)
- **Reference doc sync**: in the same PR, update `claudedocs/CLAUDEKR.md` and `claudedocs/CLAUDE_original.md` or explicitly mark them as stale.

### 코스 교정
불명확하면 초기에 멈추고 가정/전제를 명시한다. 컨텍스트가 지저분해지면 작업 단위마다 정리한다.

---

## 1) 안전 & 보안 (Hard Rails)

### 위험 작업은 명시적 승인 필요
다음은 요청/승인 없이 실행/제안하지 않는다:
- 대량 삭제, 히스토리 재작성, force push, 전역 대규모 리팩토링
- 롤백 계획 없는 파괴적 DB 변경/마이그레이션
- 비밀/키/자격증명 취급, 프로덕션 직접 변경

### 보안 규칙
- `.env`, 토큰, 키, 크리덴셜은 민감정보다. PR/이슈/로그/커밋 메시지에 남기지 않는다.
- 필요한 경우 마스킹/최소 노출을 지킨다.

---

## 2) Anti-Hallucination (추측 금지 규율)

### 버전/옵션/API는 추측하지 않는다
중요한 버전/옵션/API는 다음 순서로 “근거”를 확보한다:
1) lockfile / manifest / CI 설정
2) 레포 문서(README, ADR 등)
3) 문서 조회 도구(예: Context7)

검증되지 않은 API/옵션은 사용하지 않는다.

---

## 3) MCP: Context7 규칙

### 반드시 사용해야 하는 경우
- 신규 dependency 설치/설정
- 외부 API/SDK 사용
- 프레임워크 boilerplate/config 생성
- 버전별 문법/Deprecated 여부 확인

### 사용 방법
- 프롬프트에 `use context7`
- 필요 시 `use library /org/project` (예: `/vercel/next.js`, `/prisma/prisma`)

### 금지
- Context7 없이 라이브러리 관련 코드 생성
- 학습데이터 기반 추측
- 문서에 없는 API/함수/옵션 사용

---

## 4) 핵심 개발 철학

### Simplicity First (최상위)
- 가장 단순한 working code부터. 필요해질 때만 추상화.
- YAGNI/KISS 준수. Rule of Three(중복 3번째에 추상화).
- 미래 예측 기능 추가 금지. 현재 요구사항만 충족.

### Clean Code
- 중복 제거를 최우선
- 네이밍과 구조로 의도 표현
- 함수는 작고 단일 책임
- 상태/사이드이펙트 최소화

### OOP / SOLID (실용 적용)
- 캡슐화: 행동을 노출, getter/setter 남발 금지
- 상속보다 조합, 조건문보다 다형성
- SOLID는 과잉추상화 없이 “필요할 때” 적용

---

## 5) TDD + Tidy First (필수)

### TDD (Kent Beck)
항상 Red → Green → Refactor
- Red: 가장 단순한 실패 테스트부터 (테스트 없이 프로덕션 코드 금지)
- Green: 최소 구현만
- Refactor: green 상태에서만, 실패 시 즉시 롤백

규칙:
- 한 번에 테스트 1개
- 테스트 결정론 보장(시간/랜덤/비동기 통제)
- 유닛 테스트에서 외부 의존성(네트워크/파일/시간/랜덤/DB) 격리

### Tidy First (구조/행동 분리)
- STRUCTURAL(동작 불변)과 BEHAVIORAL(동작 변경)을 같은 커밋에 섞지 않는다.
- 둘 다 필요하면 구조 변경 먼저, 별도 커밋, 이후 행동 변경.

### 버그 수정 프로토콜
1) API 레벨 회귀 테스트 추가
2) 최소 재현 테스트 추가
3) 최소 수정으로 통과
4) green 이후 리팩토링

---

## 6) Verification: Tests + Evaluation Set

### 테스트 피라미드
- Unit: 빠르고 격리된 비즈니스 규칙
- Integration: 경계/DB/인프라 검증
- E2E: 핵심 사용자 여정 최소

### Evaluation Set(평가셋) — 품질 회귀 하네스
테스트만으로 품질을 담기 어려운 영역(검색/랭킹/추천/LLM 출력/포맷 준수/스크린샷 비교/데이터 품질/성능 기준선)은 평가셋을 운영한다.

규칙:
- 새 사용자 영향 동작은 “자동 검증”이 있어야 한다: tests 또는 evals.
- eval은 재현 가능해야 한다(입력+기대결과/지표+버전 관리).
- CI에는 최소 “smoke eval”을 두고, full eval은 주기적으로 실행한다.

권장 디렉토리(레포에 맞게 존재하면 사용):
- `tests/` : unit/integration/e2e
- `eval/` :
  - `eval/cases/` (YAML/JSONL: input/expected/notes)
  - `eval/harness/` (runner)
  - `eval/baselines/` (golden outputs/metrics)
  - `eval/reports/` (generated; 보통 gitignore)

테스트 vs eval 선택:
- 결정론적 계약/로직 → tests
- 통계적/품질/LLM/UX 동등성 → evals
- 애매하면 tests로 시작, 부족한 품질 표면은 eval로 보강

---

## 7) 멀티 레포 공용: “레포 커맨드 자동 탐지” 프로토콜 (중요)

### 원칙: 커맨드는 절대 추측하지 않는다
레포별 실행 커맨드(build/test/lint/typecheck/e2e/eval)는 사람에게 묻거나 임의로 만들지 않는다.
반드시 레포에서 “근거를 찾아” 사용한다.

### 탐지 순서(근거 소스)
1) `package.json`의 `scripts` (JS/TS)
2) `Makefile` / `justfile` / `taskfile.yml`
3) Python: `pyproject.toml`(tool 설정), `noxfile.py`, `tox.ini`, `poetry`/`uv` 설정
4) CI 설정(`.github/workflows/*`, `gitlab-ci.yml` 등)에서 실제 실행 스텝
5) README/CONTRIBUTING에 명시된 명령

### fast vs full 구분
- `test:fast`, `test:unit`, `test:smoke`, `lint`, `typecheck`처럼 “빠른 게이트”가 있으면 우선 실행
- 풀 스위트만 있으면, 먼저 “가장 작은 검증 단위(단일 테스트/스모크)” 실행을 제안하되,
  실제 실행은 레포에서 제공되는 명령으로만 한다.

### 레포에 커맨드가 전혀 없으면
- “추가하자”는 제안은 가능하지만, 무단으로 스크립트를 발명하지 않는다.
- 합의 후에만 `scripts`/Makefile/CI에 표준 커맨드를 추가한다.

---

## 8) 자산화 규칙 (AI 네이티브 루프)

### Spec → Implement → Retro (사소하지 않은 변경은 필수)
- 스펙(이슈/PR 설명 가능)을 남긴다.
- 테스트/평가셋으로 검증한다.
- 회고: 실패/학습/다음 번 프롬프트 개선 포인트를 기록한다.

### 어디에 남길지(최소 규칙)
- 스펙: Issue/PR description
- 결정(왜): `docs/adr/` 또는 PR의 Decision Log
- 회고: PR 코멘트 또는 `docs/retros/`
- 재사용 프롬프트: `.claude/commands/` 또는 `prompts/`

PR 최소 포함:
- 변경 요약(1–3 bullets)
- 수행한 검증(tests/eval)
- 리스크/롤백(해당 시)
- 새 가정/결정/회고(해당 시)

---

## 9) 커밋 규율 (필수)

- 관련 테스트/eval이 green일 때만 커밋
- 린트/타입체크는 레포 기준을 따른다
- 작은 커밋 선호
- 구조 변경과 행동 변경은 분리 커밋
- 필요 시 커밋 메시지에 STRUCTURAL/BEHAVIORAL 표시

---

## 10) 유지보수 원칙 (이 파일 자체)

- 이 파일은 항상-on 레일이다. 길어지면 `docs/`로 내리고 여기엔 링크만 둔다.
- 같은 실패가 반복되면 “트리거 기반 규칙”으로 예방한다.
- 장문 철학보다 체크리스트/프로토콜을 선호한다.


