<!-- policy-sync-warning:start -->
warning_type: reference_only
non_normative_reference_only: true
last_sync_date: 2026-02-16
stale_since: 2026-03-06
stale_reason: "CLAUDE.md updated with new linked modules (code_review_policy, quality_gates, context_management, cost_awareness, learning_policy), new checklists (code_review, quality_gate, eval), new templates (eval_definition, eval_report, session_retro)"
source_of_truth: ../CLAUDE.md
source_commit_hash: 03e12a011a5c49411b6e6585e53768e9a02e265f
<!-- policy-sync-warning:end -->

# CLAUDE.md (에이전트 규칙 - 계층형)

이 파일은 **항상-on(always-on)** 에이전트 정책입니다. 짧게 유지합니다.

## 네비게이션

- 여기부터 읽고, 아래 인덱스로 이동합니다:
  - `INDEX.md`
  - `rules/INDEX.md`
  - `checklists/INDEX.md`
  - `templates/INDEX.md`

## 적용 범위

- 이 정책은 에이전트가 활성화되어 있는 동안 이 레포/워크스페이스에 적용됩니다.
- 링크된 모듈 문서가 이 파일과 충돌하면, **이 파일을 우선**합니다.

## 용어 (RFC 2119)

- **MUST**: 필수. 준수할 수 없으면 Exception Protocol을 따릅니다.
- **SHOULD**: 기본 기대치. 짧은 근거가 있으면 생략할 수 있습니다.
- **MAY**: 선택 사항.

## 우선순위 (충돌 해결)

1) **안전 & 보안**
2) **레포의 사실(Repo Truth)** (lockfiles / manifests / CI / repo docs)
3) **검증(Verification)** (tests/evals/재현 가능한 절차)
4) **변경 통제(Change Control)** (최소 변경, 범위 제한된 diff)
5) **유지보수성(Maintainability)** (가독성, tidy 리팩토링)

## 양보 불가 항목 (MUST)

- **추측 금지**: 버전, 커맨드, API, 파일을 발명하지 않습니다.
- **레포 커맨드**: build/test/lint/typecheck/e2e/eval 커맨드를 추측하지 않습니다. 레포에서 근거를 찾아 사용합니다.
- **위험 작업**: 위험한 변경을 제안/실행하기 전에 명시적 승인을 받습니다.
- **검증**: 사용자 영향 변경은 최소 1개의 재현 가능한 검증 아티팩트가 있어야 합니다.
- **근거 제시**: 핵심 결정은 구체적 근거(파일 경로 + 발췌 또는 커맨드 출력)를 함께 제공합니다.
- **Reference doc sync**: in the same PR, update `claudedocs/CLAUDEKR.md` and `claudedocs/CLAUDE_original.md` or explicitly mark them as stale.

## 완료 보고 계약 (MUST)

작업이 “완료”되었다고 주장할 때, 최종 메시지에 아래 3가지를 반드시 포함합니다.

- **적용한 규칙**: 어떤 규칙/체크리스트를 적용했는지(해당 문서 링크 포함)
- **근거**: 핵심 주장에 대한 구체적 근거(파일 경로 + 발췌 또는 커맨드 출력)
- **검증**: 무엇으로 검증했는지(커맨드/결과 또는 결정론적 수동 재현 절차)

## 기본 워크플로우 (MUST)

- **Explore**: 관련 파일/설정/CI/락파일을 읽어 사실을 확보합니다. 이 단계에서는 수정하지 않습니다.
- **Plan**: 작고 검증 가능한 계획(검증 수단 포함)을 제시합니다.
- **Implement**: 최소 변경으로 구현하고, 범위 확장을 피합니다.
- **Verify**: 가장 빠른 관련 게이트부터 실행하고, 필요하면 전체 게이트로 확장합니다.
- **Record**: 변경 요약, 근거, 검증, 리스크, 롤백을 정리합니다.

## 예외 프로토콜 (막혔을 때 MUST)

어떤 MUST도 준수할 수 없는 경우:

1) **이유**를 설명합니다(무엇이 준수를 막는지).
2) **대안 2–3개**를 제시합니다(안전한 옵션만).
3) 대안이 위험하거나 되돌리기 어려우면 **명시적 확인**을 요청합니다.

## Context7 정책 (트리거 기반)

- **새로운** 외부 API/SDK를 도입하거나, 신규 dependency, 버전 민감 문법, deprecated 의심이 있으면 Context7을 **MUST**로 사용합니다.
- 레포 내부에 동일한 API 사용 패턴이 이미 존재하고, 그 패턴을 따르는 수정이라면 Context7은 **MAY**로 생략할 수 있습니다.

## 연결된 모듈

- Safety & security: [`rules/safety_security.md`](../rules/safety_security.md)
- Anti-hallucination & evidence: [`rules/anti_hallucination.md`](../rules/anti_hallucination.md)
- Repo command discovery: [`rules/repo_command_discovery.md`](../rules/repo_command_discovery.md)
- Context7 trigger policy: [`rules/context7_policy.md`](../rules/context7_policy.md)
- Verification (tests + evals): [`rules/verification_tests_and_evals.md`](../rules/verification_tests_and_evals.md)
- Change control (minimal change, scope, tidy): [`rules/change_control.md`](../rules/change_control.md)
- Documentation policy (optional): [`rules/documentation_policy.md`](../rules/documentation_policy.md)
- Assetization (spec/decision/retro): [`rules/assetization.md`](../rules/assetization.md)
- Commit/PR discipline: [`rules/commit_and_pr.md`](../rules/commit_and_pr.md)

## 체크리스트 (필요 시 사용)

- Planning: [`checklists/plan.md`](../checklists/plan.md)
- Verification: [`checklists/verify.md`](../checklists/verify.md)
- Risky actions: [`checklists/risky_actions.md`](../checklists/risky_actions.md)
- Bugfix protocol: [`checklists/bugfix.md`](../checklists/bugfix.md)
- PR body: [`checklists/pr.md`](../checklists/pr.md)

## 템플릿

- Assumptions: [`templates/assumptions.md`](../templates/assumptions.md)
- Decision log: [`templates/decision_log.md`](../templates/decision_log.md)
- PR description: [`templates/pr_body.md`](../templates/pr_body.md)
- Retro note: [`templates/retro.md`](../templates/retro.md)


