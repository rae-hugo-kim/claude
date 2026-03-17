---
name: sum
allowed-tools: Write, Bash(mkdir:*)
argument-hint: [filename]
description: Summarizes the current conversation to docs/sum/. Use when the user says "sum", "요약해줘", "정리해줘", "요약문서 만들어줘", "세션 저장", or wants to preserve session context.
---

# Sum - Summarize Conversation

## Goal

Summarize the current conversation to a markdown file for future reference.

## Inputs

- `$ARGUMENTS`: Custom filename (optional). Default: `session_YYYY-MM-DD_<topic>.md`

## Output Path

```
<project-root>/docs/sum/<filename>.md
```

If `docs/sum/` doesn't exist, create it.

## Process

### 1. Create output directory

```bash
mkdir -p docs/sum
```

### 2. Generate summary

Analyze the conversation and extract:

```markdown
# Session Summary: <main topic>

**Date**: YYYY-MM-DD
**Duration**: ~N messages

## Topics Covered
- Topic 1
- Topic 2

## Key Decisions
- Decision 1: <what was decided>
- Decision 2: <what was decided>

## Work Completed
- [x] Task 1 — <status/outcome>
- [x] Task 2 — <status/outcome>

## Files Changed
- `path/to/file1` — <what changed>
- `path/to/file2` — <what changed>

## Open Items
- Item needing follow-up
- Unresolved question

## Notes
<Any important context for future reference>
```

### 3. Save file

Write to `docs/sum/<filename>.md`

### 4. Output

Report: `File saved: docs/sum/<filename>.md`

### 5. Clear context (optional)

After saving, suggest `/clear` to reset conversation context.

## Constraints

| Rule | Rationale |
|------|-----------|
| Preserve key decisions | Never lose decision rationale |
| List all file changes | Important for continuity |
| Note open items | Next session knows what's pending |
| Be concise | Summary, not transcript |

## Error Handling

| Condition | Action |
|-----------|--------|
| Can't create directory | Report error, suggest manual creation |
| No meaningful content | Create minimal summary, note "short session" |
