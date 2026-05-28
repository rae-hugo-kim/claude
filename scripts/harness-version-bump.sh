#!/usr/bin/env bash
# harness-version-bump.sh
# Bumps harness-meta.json version when harness files are touched in the last commit.
# Idempotent: skips if HEAD already carries a harness/* tag.

set -euo pipefail

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
META_FILE="$REPO_ROOT/.claude/hooks/harness/harness-meta.json"

# --- 1. Check if the last commit touches harness files ---
HARNESS_PATTERNS=(
  ".claude/hooks/harness/"
  ".claude/skills/"
  "rules/"
  "checklists/"
  "CLAUDE.md"
)

changed=0
for pattern in "${HARNESS_PATTERNS[@]}"; do
  if git -C "$REPO_ROOT" diff --name-only HEAD~1 HEAD 2>/dev/null | grep -q "^$pattern"; then
    changed=1
    break
  fi
done

if [[ $changed -eq 0 ]]; then
  exit 0
fi

# --- 2. Idempotency: skip if HEAD already carries a harness tag ---
existing_tag=$(git -C "$REPO_ROOT" tag --points-at HEAD 'harness/*' 2>/dev/null | head -n1)
if [[ -n "$existing_tag" ]]; then
  exit 0
fi

# --- 3. Read current version ---
current_version=$(grep '"version"' "$META_FILE" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
current_year="${current_version%%.*}"
current_seq="${current_version##*.}"

# --- 4. Compute new version ---
this_year="$(date +%Y)"
if [[ "$this_year" != "$current_year" ]]; then
  new_version="${this_year}.1"
else
  new_version="${current_year}.$((current_seq + 1))"
fi

tag_name="harness/${new_version}"

# --- 5. Update harness-meta.json ---
today="$(date +%Y-%m-%d)"
sed -i \
  -e "s/\"version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"version\": \"${new_version}\"/" \
  -e "s/\"updated\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"updated\": \"${today}\"/" \
  "$META_FILE"

# --- 6. Amend last commit to include the version bump ---
git -C "$REPO_ROOT" add "$META_FILE"
git -C "$REPO_ROOT" commit --amend --no-edit

# --- 7. Create annotated git tag (so `git push --follow-tags` picks it up) ---
git -C "$REPO_ROOT" tag -a "$tag_name" -m "harness ${new_version}"

echo "harness version bumped: ${current_version} -> ${new_version} (tag: ${tag_name})"

# --- 8. Append audit score row to history (best-effort; failure must not block) ---
# Issue #11: track audit results over time at each harness/* tag fire.
# Output: .omc/state/harness-scores.jsonl, one JSON object per line.
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
        total = int(m.group(1))
        continue
    m = re.match(r"^\s+(\w+):\s+(\d+)/10\s*$", line)
    if m:
        by_cat[m.group(1)] = int(m.group(2))
row = {
    "ts": os.environ["TS"],
    "version": os.environ["VERSION"],
    "rubric_version": os.environ["RUBRIC"],
    "total": total,
    "by_cat": by_cat,
}
print(json.dumps(row))
' >> "$scores_file"
  echo "harness audit recorded -> ${scores_file}"
} || true
