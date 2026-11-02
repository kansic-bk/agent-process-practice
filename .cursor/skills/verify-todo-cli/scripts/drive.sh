#!/usr/bin/env bash
# Usage: drive.sh RUN_ID LABEL -- <cli args>
# Run one CLI command in the run's tmux session and print the captured result.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

if [ "$#" -lt 4 ]; then
  echo "usage: drive.sh RUN_ID LABEL -- <cli args>" >&2
  exit 1
fi
RUN_ID=$1
LABEL=$2
shift 2
if [ "${1:-}" != "--" ]; then
  echo "usage: drive.sh RUN_ID LABEL -- <cli args>" >&2
  exit 1
fi
shift
if [ "$#" -lt 1 ]; then
  echo "drive.sh missing CLI args" >&2
  exit 1
fi
case "$LABEL" in
  ""|*[!A-Za-z0-9._-]*)
    echo "LABEL must match [A-Za-z0-9._-]+" >&2
    exit 1
    ;;
esac
for arg in "$@"; do
  if [ "$arg" = "--file" ]; then
    echo "do not pass --file to drive.sh; the harness selects the temp store" >&2
    exit 1
  fi
done
load_run "$RUN_ID"
if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "tmux session $SESSION is not running" >&2
  exit 1
fi

marker="$DATA_DIR/markers/$LABEL.done"
rm -f "$marker"
command_text="node src/cli.js --file $(shell_quote "$TODO_FILE") $(shell_quote "$@")"
printf '%s\n' "$command_text" > "$EVIDENCE/$LABEL.cmd"

send="cd $(printf %q "$REPO_ROOT") && RUN_ID=$(printf %q "$RUN_ID") LABEL=$(printf %q "$LABEL") $(printf %q "$SCRIPT_DIR/session-run.sh") --"
for arg in "$@"; do
  send+=" $(printf %q "$arg")"
done
tmux send-keys -t "$SESSION:0.0" "$send" C-m

i=0
while [ "$i" -lt 150 ]; do
  if [ -f "$marker" ]; then
    break
  fi
  i=$((i + 1))
  sleep 0.1
done
if [ ! -f "$marker" ]; then
  tmux capture-pane -p -t "$SESSION:0.0" > "$EVIDENCE/$LABEL.pane.txt" || true
  echo "drive timed out for $LABEL; pane saved to $EVIDENCE/$LABEL.pane.txt" >&2
  echo "run cleanup.sh $RUN_ID after inspecting the pane" >&2
  exit 1
fi

exit_code=$(tr -d '[:space:]' < "$EVIDENCE/$LABEL.exit")
changed=$(tr -d '[:space:]' < "$EVIDENCE/$LABEL.store-changed")
printf 'label: %s\n' "$LABEL"
printf 'command: %s\n' "$command_text"
printf 'exit: %s\n' "$exit_code"
printf 'store-changed: %s\n' "$changed"
printf '%s\n' '--- stdout ---'
cat "$EVIDENCE/$LABEL.stdout"
printf '%s\n' '--- stderr ---'
cat "$EVIDENCE/$LABEL.stderr"
printf '%s\n' '--- store ---'
if [ -f "$EVIDENCE/$LABEL.store.json" ]; then
  cat "$EVIDENCE/$LABEL.store.json"
else
  printf '%s\n' absent
fi
