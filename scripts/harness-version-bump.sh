#!/usr/bin/env bash
# harness-version-bump.sh [--dry-run]
#
# DELIBERATE harness version bump — run ONCE after a harness change lands on main
# (e.g. right after merging a harness PR), NOT as a per-commit hook. Bumps the
# version a single time for everything that changed since the last harness/* tag,
# so one logical change = one version (no per-commit churn).
#
# Idempotent: if no harness asset changed since the last harness/* tag, it does
# nothing. Safe to run repeatedly.
#
# What it does (unless --dry-run): updates harness-meta.json, makes a dedicated
# `chore(harness): bump ...` commit (only the meta file), creates an annotated
# harness/<version> tag, and appends an audit-score row. It does NOT push — run
# `git push --follow-tags` yourself after reviewing.

set -euo pipefail

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
META_FILE="$REPO_ROOT/.claude/hooks/harness/harness-meta.json"

# Harness asset paths that warrant a version bump. Keep ALIGNED with the synced
# set in scripts/harness-sync.sh (PATHS): a change to anything consumers receive
# should produce a new version. (Excludes docs-build/docs-drift, which are not
# synced to consumers.)
HARNESS_PATHS=(
  "rules/"
  "checklists/"
  "templates/"
  "CLAUDE.md"
  "INDEX.md"
  "EXAMPLES.md"
  ".claude/hooks/harness/"
  ".claude/settings.json"
  ".githooks/"
  "scripts/harness-version-bump.sh"
  "scripts/harness-sync.sh"
  "scripts/harness-audit.sh"
  "scripts/test-harness-audit.sh"
  ".claude/skills/"
)

# --- 1. Establish the comparison base: the commit of the latest harness/* tag ---
last_tag="$(git -C "$REPO_ROOT" tag -l 'harness/*' --sort=-v:refname | head -n1)"
if [[ -n "$last_tag" ]]; then
  base="$(git -C "$REPO_ROOT" rev-list -n1 "$last_tag")"
else
  base="$(git -C "$REPO_ROOT" rev-list --max-parents=0 HEAD | tail -n1)" # first commit
fi

# --- 2. Did any harness asset change since the base? ---
changed_files="$(git -C "$REPO_ROOT" diff --name-only "$base" HEAD 2>/dev/null || true)"
changed=0
for pattern in "${HARNESS_PATHS[@]}"; do
  if printf '%s\n' "$changed_files" | grep -q "^$pattern"; then
    changed=1
    break
  fi
done

if [[ $changed -eq 0 ]]; then
  echo "Harness unchanged since ${last_tag:-the first commit}; nothing to bump."
  exit 0
fi

# --- 3. Compute the new version (year-rolling sequence) ---
current_version="$(grep '"version"' "$META_FILE" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')"
current_year="${current_version%%.*}"
current_seq="${current_version##*.}"
this_year="$(date +%Y)"
if [[ "$this_year" != "$current_year" ]]; then
  new_version="${this_year}.1"
else
  new_version="${current_year}.$((current_seq + 1))"
fi
tag_name="harness/${new_version}"
today="$(date +%Y-%m-%d)"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "--- Dry run ---"
  echo "Base tag:        ${last_tag:-<none>} (${base:0:9})"
  echo "Changed harness files since base:"
  printf '%s\n' "$changed_files" | grep -E "$(IFS='|'; echo "^(${HARNESS_PATHS[*]})")" | sed 's/^/  /' || true
  echo "Would bump:      ${current_version} -> ${new_version} (tag: ${tag_name})"
  exit 0
fi

# --- 4. Update harness-meta.json ---
sed -i \
  -e "s/\"version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"version\": \"${new_version}\"/" \
  -e "s/\"updated\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"updated\": \"${today}\"/" \
  "$META_FILE"

# --- 5. Dedicated commit (meta file only — does not sweep other staged changes) ---
git -C "$REPO_ROOT" add "$META_FILE"
git -C "$REPO_ROOT" commit -m "chore(harness): bump version to ${new_version}" -- "$META_FILE"

# --- 6. Annotated tag (so `git push --follow-tags` picks it up) ---
git -C "$REPO_ROOT" tag -a "$tag_name" -m "harness ${new_version}"

echo "harness version bumped: ${current_version} -> ${new_version} (tag: ${tag_name})"
echo "Now push:  git push --follow-tags"

# --- 7. Append audit-score row (best-effort; failure must not block) ---
# Issue #11: track audit results over time, one row per harness/* version.
{
  scores_file="$REPO_ROOT/.omc/state/harness-scores.jsonl"
  mkdir -p "$(dirname "$scores_file")"
  audit_out="$(bash "$REPO_ROOT/scripts/harness-audit.sh" --root "$REPO_ROOT" --terse 2>/dev/null)"
  rubric_version="$(bash "$REPO_ROOT/scripts/harness-audit.sh" --rubric-version 2>/dev/null)"
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '%s' "$audit_out" | TS="$ts" VERSION="$new_version" RUBRIC="$rubric_version" python3 -c '
import json, os, re, sys
total = None
by_cat = {}
for line in sys.stdin.read().splitlines():
    m = re.match(r"^\s*TOTAL:\s+(\d+)/\d+\s*$", line)
    if m:
        total = int(m.group(1)); continue
    m = re.match(r"^\s+(\w+):\s+(\d+)/10\s*$", line)
    if m:
        by_cat[m.group(1)] = int(m.group(2))
print(json.dumps({"ts": os.environ["TS"], "version": os.environ["VERSION"],
                  "rubric_version": os.environ["RUBRIC"], "total": total, "by_cat": by_cat}))
' >> "$scores_file"
  echo "harness audit recorded -> ${scores_file}"
} || true
