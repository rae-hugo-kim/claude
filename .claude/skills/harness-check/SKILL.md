---
name: harness-check
allowed-tools: Bash(node:*), Bash(cat:*), Read
argument-hint: [--force]
description: Manually check if the local harness is behind the source remote. Use when the user says "harness-check", "harness version", "하네스 버전", or wants to force a version/SHA drift check bypassing the 24h cache.
---

# Harness Check - Manual Version Drift Check

## Goal

Run the harness version check on demand, bypassing the 24h cache, and report drift status explicitly (even when up to date).

## Inputs

- `$ARGUMENTS`: pass `--force` (default) to refresh now. Pass nothing for same behavior.

## Constraints

| Rule | Rationale |
|------|-----------|
| Source repo self-skip | If `harness-meta.json` has no `source_remote`, this IS the source; do not run the check |
| Network optional | If `git ls-remote` fails, report the failure but do not treat as drift |
| No auto-update | This skill reports only — syncing is a separate re-bootstrap step |

## Process

### 1. Verify harness-meta.json exists

```bash
cat .claude/hooks/harness/harness-meta.json
```

If missing → tell the user the harness is not installed, point to `/bootstrap`.

### 2. Detect source vs consumer

If `source_remote` field is absent → this repo is the source. Report:
> Source harness repo detected (no `source_remote` in meta). Nothing to check — this repo publishes the harness.

### 3. Run the check with --force

```bash
node .claude/hooks/harness/harness-version-check.mjs --force
```

The script:
- Refetches `git ls-remote --tags <source_remote> 'refs/tags/harness/*'`
- Updates the 24h cache at `.omc/state/harness-version-check.json`
- Compares version rank primary, commit SHA fallback
- Emits a drift line only on mismatch

### 4. Report

| State | Report |
|-------|--------|
| Drift detected | Echo the hook output + suggest re-running `/bootstrap` to sync |
| In sync (no output) | Explicitly say "Harness is up to date: local `<version>` matches remote" |
| Network failure | "Could not reach `<source_remote>`. Check network or remote URL in harness-meta.json" |

## Verification

```bash
cat .omc/state/harness-version-check.json
```

Confirm `checkedAt` is within the last minute.

## Error Handling

| Condition | Action |
|-----------|--------|
| No harness-meta.json | Instruct user to run `/bootstrap` |
| No `source_remote` | Explain this is the source repo |
| `git ls-remote` timeout | Report network error, do not claim drift |
| Cache write failure | Report but proceed — non-fatal |
