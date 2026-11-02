#!/usr/bin/env bash
# Usage: cleanup.sh RUN_ID
# Kill the tmux session this run started and remove its data dir. Keep the evidence dir.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

if [ "$#" -ne 1 ]; then
  echo "usage: cleanup.sh RUN_ID" >&2
  exit 1
fi
RUN_ID=$1
validate_run_id "$RUN_ID"
DATA_DIR=$(data_dir_for "$RUN_ID")
EVIDENCE=$(evidence_dir_for "$RUN_ID")
SESSION=$(session_name_for "$RUN_ID")
assert_run_paths "$RUN_ID"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux kill-session -t "$SESSION"
  printf 'session: killed %s\n' "$SESSION"
else
  printf 'session: absent %s\n' "$SESSION"
fi

if [ -e "$DATA_DIR" ]; then
  if [ -L "$DATA_DIR" ]; then
    echo "refusing to remove symlinked data dir $DATA_DIR" >&2
    exit 1
  fi
  if path_inside_repo "$DATA_DIR"; then
    echo "refusing to remove data dir inside the repo: $DATA_DIR" >&2
    exit 1
  fi
  actual=$(node_realpath "$DATA_DIR")
  expected=$(node_realpath "/tmp/todo-cli-verify-data-$RUN_ID")
  if [ "$actual" != "$expected" ]; then
    echo "refusing to remove $DATA_DIR (realpath $actual)" >&2
    exit 1
  fi
  rm -rf "$DATA_DIR"
  printf 'data: removed %s\n' "$DATA_DIR"
else
  printf 'data: absent %s\n' "$DATA_DIR"
fi

if [ ! -d "$EVIDENCE" ]; then
  echo "evidence dir is missing: $EVIDENCE" >&2
  exit 1
fi
printf 'evidence: %s\n' "$EVIDENCE"
find "$EVIDENCE" -type f | sort
