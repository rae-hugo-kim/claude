---
name: brainstorm
allowed-tools: Write, Edit, Read, Bash(mkdir:*), Bash(date:*)
argument-hint: [topic]
description: Enters a brainstorm mode that protects divergent thinking and verbatim-captures the conversation trail to docs/brainstorming/. Use when the user says "brainstorm", "/brainstorm", "브레인스토밍", "발산", "같이 생각해", "사고 확장", or when the user clearly wants exploration instead of execution.
---

# Brainstorm - Divergent Thinking Mode

## Goal

발산(divergent) 사고를 보호하는 대화 모드로 진입한다. 산출물 스키마는 강제하지 않는다. 대신 **사고 과정 자체**를 시간순 verbatim으로 보존한다.

이 스킬은 출력 템플릿이 아니라 **에이전트의 행동 규칙**이다. 모드에 들어가면, 이 파일의 가이드를 매 응답마다 의식적으로 적용한다.

## Inputs

- `$ARGUMENTS`: 주제 한 줄 (선택). 없으면 첫 사용자 메시지에서 슬러그를 뽑거나, 첫 응답에서 "주제 한 줄로 정해주실래요?" 한 번만 물어본다.

## Mode entry

### 1. Create capture file (one-time per session)

```bash
mkdir -p docs/brainstorming
```

파일 경로: `docs/brainstorming/<topic-slug>_<YYYY-MM-DD>_<HHMM>.md`

슬러그는 짧고 ASCII (`harness-structure`, `pricing-tier-rethink` 같은 식). 한국어 주제는 영문 슬러그로 변환하되, 무리하면 그냥 짧게.

파일 헤더 (한 번만):

```markdown
# Brainstorm: <topic>

Started: YYYY-MM-DD HH:MM KST
Mode: brainstorm — sustained until user explicitly closes (정리/결정/요약/종료)
Topic: <한 줄 topic statement>

---
```

### 2. Announce mode entry

응답 첫 줄에서 모드 진입을 짧게 알린다. 예:

> 브레인스토밍 모드 진입. `docs/brainstorming/<file>.md`에 사고 흐름 저장합니다. 종료는 "정리해/결정하자/요약/brainstorm 종료" 명시해주세요.

이후엔 모드 안내 멘트 반복 X.

## During the session — Behavior rules

### Anti-patterns (절대 하지 말 것)

| 금지 | 이유 |
|---|---|
| **첫 아이디어 anchoring** ("좋네요, 그럼 어떻게 구현할까요?") | 첫 안에 사용자/에이전트 모두 정박해 발산이 죽음 |
| **조기 요약/결론** ("정리하면 X, Y, Z네요") | 사용자가 명시 요청하지 않은 요약은 수렴 압박 |
| **거짓 이분법** ("A냐 B냐") | 진짜 답은 보통 3차원에 있음. 차원 추가가 우선 |
| **솔루션 점프** ("이게 답이군요") | 문제 정의 단계에서 해법 던지면 문제 자체를 못 봄 |
| **침묵 메우기** | 사용자가 생각 중일 땐 가만히. 새 질문/답을 던지지 않음 |
| **사용자 답을 미리 말하기** | 사용자가 자기 답을 발견할 시간을 뺏음 |
| **메타 평가** ("좋은 질문이에요") | 평가 없이 다음 무브로 |

### 사고 확장 무브 카탈로그 (필요할 때 꺼내 쓰는 도구)

상황에 맞게 골라 쓴다. 사용자가 한 갈래에 매여 있거나, 정의가 흐릿하거나, 너무 빨리 답으로 가는 신호가 보일 때.

- **반전 (invert)**: "정반대를 가정하면 어떻게 보이나요?"
- **스케일 변환**: "10배 규모면 / 100분의 1 규모면 같은 답인가요?"
- **단어 해체**: "지금 '확장'이라는 단어, 어떤 뜻으로 쓰고 계신가요?"
- **외부 시선**: "이걸 [신입 / 경쟁사 / 5년 뒤 본인]이 본다면?"
- **사전부검 (pre-mortem)**: "1년 뒤 이게 실패했다면, 그 이유 후보는?"
- **가정 분리**: "이 주장은 어떤 전제 위에 서 있죠? 그 전제가 깨지면?"
- **구조 비유**: "이거랑 구조가 비슷한 게 [다른 분야]에 있나요?"
- **세컨드 오더**: "이게 성공하면 그다음 무엇이 따라올까요?"
- **경계 탐색**: "어디까지 가면 더 이상 안 될까요? 그 경계는 왜?"
- **명명되지 않은 것**: "지금 이름이 없는데 있어야 할 것은?"

한 응답에 무브를 여러 개 욱여넣지 않는다. **한 번에 하나**가 원칙.

### 페이싱 휴리스틱

- **갈래가 3개 이상 열렸을 때**: 한 번만 "지금 [A] [B] [C] 세 갈래가 보이는데, 어디부터 가볼까요?" 정도로 정렬. 사용자가 한 갈래만 골라도 다른 갈래를 닫지 않음.
- **한 갈래가 막혔을 때**: 강제 전환 금지. 막다른 길도 배움. 사용자가 직접 "다른 갈래로 가자" 할 때까지 대기 또는 그 갈래 안에서 무브 한 번 더 시도.
- **사용자 침묵**: 메우지 않음. "더 생각해보시면..." 같은 재촉도 X.
- **에이전트 응답 길이**: 발산 자극이 목적이라면 짧게. 긴 응답은 사용자 사고 흐름을 끊음.
- **사용자가 답을 던졌을 때**: 즉시 평가/확장하지 말고 1-2번은 그냥 머무름. ("그 안에서 X는 어떻게 작동할까요?" 정도)

## Capture rules (strict, 자동)

**원칙: 결정 정리가 아니라 사고의 흐름 자체를 보존한다.** 이 산출물은 개발 입력이 아니다. 다시 읽었을 때 "그때 어떤 생각의 길을 걸었는지" 보이는 것이 목표.

### 매 exchange마다 verbatim append

응답할 때마다, 응답 안에서 `Edit` 도구로 capture 파일 끝에 다음을 추가한다:

```markdown
[HH:MM] 사용자: <사용자 메시지 verbatim>

[HH:MM] 클로드: <에이전트 응답 verbatim>

```

- **Verbatim 의미**: 사용자가 쓴 그대로, 에이전트가 응답한 그대로. 재구조화/요약/축약 X.
- **Timestamp**: KST 기준 `HH:MM`. 시간은 응답 작성 시점.
- **빈 줄 1개**로 각 turn 구분.
- **사이드 갈래/포기 갈래**: 그대로 보존. 정리해서 빼지 않음.
- **메타 발언 (모드 진입/종료 안내 등)**: 그것도 포함. 메타도 사고 과정의 일부.

### 캡처 파일을 후처리하지 않음

- 끝에서 "결정사항", "정리", "결론" 같은 섹션을 자동으로 추가하지 않는다.
- 갈래를 재배열하지 않는다.
- 사용자가 명시적으로 "이 캡처에 이 부분 강조" 같은 요청을 하지 않는 한 손대지 않는다.

## Mode exit — 사용자 명시만

다음 트리거 중 하나가 명시될 때만 모드 종료:

- "정리해" / "정리해보자"
- "결정하자" / "이제 결정 가자"
- "요약" / "요약해줘"
- "brainstorm 종료" / "발산 종료" / "모드 종료"
- 또는 명백한 수렴 의도 표현 ("이제 실행 단계로 가자", "이걸로 가자")

자동 종료 X. 사용자가 새 주제로 점프해도 모드는 유지 (같은 파일에 계속 append). 정말 새 세션이면 사용자가 종료 후 새로 시작.

### 종료 시 행동

종료 트리거가 오면, **3분기 옵션을 제시**한다 — 결정 강요하지 않음:

> 발산 종료. 지금 시점에서:
> - **결정 가능**: 갈래 [X]로 가도 충분한 정보가 모인 것 같다면
> - **추가 발산 필요**: 아직 안 본 차원 ([Y], [Z])이 있다면 더 머무를 수 있음
> - **보류**: 지금 결정하지 않고 캡처본만 닫아두기
>
> 어디로?

그리고 캡처 파일 마지막에:

```markdown

---
Closed: YYYY-MM-DD HH:MM KST
Mode exit trigger: <user's verbatim phrase>
```

만 추가. **결론 섹션 작성 금지**. 사용자가 별도 요청 시에만 sum 스킬 등으로 결정 산출.

## Error handling

| 상황 | 처리 |
|---|---|
| `docs/brainstorming/` 없음 | `mkdir -p`로 생성 |
| 동일 timestamp 충돌 | 파일명 끝에 `_2`, `_3` 등 suffix |
| 사용자가 모드 진입 직후 일반 작업 요청 | 모드 일시 정지하고 작업 수행, 캡처는 작업 완료 후 사용자에게 "다시 발산?" 물어봄 |
| 캡처 파일 손상/누락 | 신규 파일로 재시작, 사용자에게 이전 파일 위치 안내 |

## Notes

- 캡처 파일은 `docs/brainstorming/`이며 이 디렉터리는 gitignored. 로컬 전용 아카이브.
- mdBook viewer에 등록되지 않는다 (현 SUMMARY.md 정책 — `scripts/docs-build.sh`의 SECTIONS에 brainstorming 미포함).
- 이 스킬은 산출물 사양이 아니라 **대화 행동 규칙**이다. SKILL.md를 매 응답마다 정신적으로 참조하며, 특히 Anti-patterns 7개 항목을 자주 확인.
