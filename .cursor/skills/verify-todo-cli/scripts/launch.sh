#!/usr/bin/env bash
# Usage: launch.sh [RUN_ID]
# Create an isolated store, evidence dir, and tmux session. Print the ready list and export lines.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

RUN_ID=${1:-$(date +%Y%m%dT%H%M%S)-$$}
DATA_DIR=""
EVIDENCE=""
SESSION=""
TODO_FILE=""
CREATED_DATA=0
CREATED_SESSION=0

on_err() {
  local status=$?
  trap - ERR
  if [ "$CREATED_SESSION" -eq 1 ]; then
    tmux kill-session -t "$SESSION" 2>/dev/null || true
  fi
  if [ "$CREATED_DATA" -eq 1 ] && [ -n "${DATA_DIR}" ] && [ -d "$DATA_DIR" ] && [ ! -L "$DATA_DIR" ]; then
    case "$DATA_DIR" in
      /tmp/todo-cli-verify-data-*)
        rm -rf "$DATA_DIR"
        ;;
    esac
  fi
  if [ -n "${EVIDENCE}" ]; then
    echo "launch failed (exit $status); evidence kept at $EVIDENCE" >&2
  else
    echo "launch failed (exit $status)" >&2
  fi
  exit "$status"
}
trap on_err ERR

validate_run_id "$RUN_ID"
DATA_DIR=$(data_dir_for "$RUN_ID")
EVIDENCE=$(evidence_dir_for "$RUN_ID")
SESSION=$(session_name_for "$RUN_ID")
TODO_FILE="$DATA_DIR/todo.json"
assert_run_paths "$RUN_ID"

if [ -e "$DATA_DIR" ] || [ -e "$EVIDENCE" ] || tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "RUN_ID $RUN_ID is already in use. Choose another id. Evidence is never overwritten." >&2
  trap - ERR
  exit 1
fi

mkdir -m 700 -p "$DATA_DIR" "$EVIDENCE"
CREATED_DATA=1
if [ -L "$DATA_DIR" ] || [ -L "$EVIDENCE" ]; then
  echo "refusing symlink verification directory" >&2
  exit 1
fi

{
  printf 'RUN_ID=%q\n' "$RUN_ID"
  printf 'TODO_FILE=%q\n' "$TODO_FILE"
  printf 'DATA_DIR=%q\n' "$DATA_DIR"
  printf 'EVIDENCE=%q\n' "$EVIDENCE"
  printf 'SESSION=%q\n' "$SESSION"
  printf 'ROOT=%q\n' "$REPO_ROOT"
} > "$EVIDENCE/session.env"
hash_sources > "$EVIDENCE/src.sha256"
node -v > "$EVIDENCE/node-version.txt"

ready="$DATA_DIR/shell-ready"
sync_file="$DATA_DIR/shell-sync"
tmux new-session -d -s "$SESSION" -c "$REPO_ROOT" -- bash --noprofile --norc -c "touch $(printf %q "$ready"); exec bash --noprofile --norc"
CREATED_SESSION=1
i=0
while [ "$i" -lt 50 ]; do
  if [ -f "$ready" ]; then
    break
  fi
  i=$((i + 1))
  sleep 0.1
done
if [ ! -f "$ready" ]; then
  echo "tmux session did not start" >&2
  exit 1
fi
tmux send-keys -t "$SESSION:0.0" "touch $(printf %q "$sync_file")" C-m
i=0
while [ "$i" -lt 50 ]; do
  if [ -f "$sync_file" ]; then
    break
  fi
  i=$((i + 1))
  sleep 0.1
done
if [ ! -f "$sync_file" ]; then
  echo "tmux session did not accept a command" >&2
  exit 1
fi

"$SCRIPT_DIR/drive.sh" "$RUN_ID" launch-list -- list

expected="$DATA_DIR/expected-launch-list.txt"
printf '%s\n' '(할 일 없음)' > "$expected"
if ! cmp -s "$expected" "$EVIDENCE/launch-list.stdout"; then
  echo "ready check failed: list stdout was not '(할 일 없음)'" >&2
  exit 1
fi
if [ -s "$EVIDENCE/launch-list.stderr" ]; then
  echo "ready check failed: list wrote stderr" >&2
  exit 1
fi
if [ "$(tr -d '[:space:]' < "$EVIDENCE/launch-list.exit")" != "0" ]; then
  echo "ready check failed: list exit was not 0" >&2
  exit 1
fi
if [ -e "$TODO_FILE" ] || [ ! -f "$EVIDENCE/launch-list.store.absent" ]; then
  echo "ready check failed: list created a store file" >&2
  exit 1
fi
if [ "$(tr -d '[:space:]' < "$EVIDENCE/launch-list.store-changed")" != "no" ]; then
  echo "ready check failed: empty list changed the store" >&2
  exit 1
fi

trap - ERR
printf 'export RUN_ID=%s\n' "$RUN_ID"
printf 'export TODO_FILE=%s\n' "$TODO_FILE"
printf 'export DATA_DIR=%s\n' "$DATA_DIR"
printf 'export EVIDENCE=%s\n' "$EVIDENCE"
printf 'export SESSION=%s\n' "$SESSION"
printf 'export ROOT=%s\n' "$REPO_ROOT"
