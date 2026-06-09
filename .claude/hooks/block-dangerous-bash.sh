#!/usr/bin/env bash

input="$(cat)"

if echo "$input" | grep -Eiq 'rm -rf|dropdb|DROP DATABASE|DROP TABLE|curl .* \| sh|wget .* \| sh'; then
  cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Dangerous shell command blocked by personal Claude hook."
  }
}
JSON
  exit 0
fi

exit 0
