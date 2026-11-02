#!/usr/bin/env bash
# Usage (inside the run's tmux session): RUN_ID=... LABEL=... session-run.sh -- <cli args>
# drive.sh sends this. It runs node src/cli.js against the run's store and writes evidence.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

if [ -z "${RUN_ID:-}" ] || [ -z "${LABEL:-}" ]; then
  echo "session-run.sh requires RUN_ID and LABEL" >&2
  exit 1
fi
validate_run_id "$RUN_ID"
case "$LABEL" in
  ""|*[!A-Za-z0-9._-]*)
    echo "LABEL must match [A-Za-z0-9._-]+" >&2
    exit 1
    ;;
esac
load_run "$RUN_ID"
cd "$REPO_ROOT"

if [ "${1:-}" != "--" ]; then
  echo "session-run.sh expected -- before CLI args" >&2
  exit 1
fi
shift
if [ "$#" -lt 1 ]; then
  echo "session-run.sh missing CLI args" >&2
  exit 1
fi
for arg in "$@"; do
  if [ "$arg" = "--file" ]; then
    echo "do not pass --file; this run stores data only in $TODO_FILE" >&2
    exit 1
  fi
done

marker="$DATA_DIR/markers/$LABEL.done"
mkdir -p "$DATA_DIR/markers"
printf '%s\n' "$(store_stamp "$TODO_FILE")" > "$EVIDENCE/$LABEL.before"
set +e
node src/cli.js --file "$TODO_FILE" "$@" >"$EVIDENCE/$LABEL.stdout" 2>"$EVIDENCE/$LABEL.stderr"
status=$?
set -e
printf '%s\n' "$status" > "$EVIDENCE/$LABEL.exit"
printf '%s\n' "$(store_stamp "$TODO_FILE")" > "$EVIDENCE/$LABEL.after"
if [ -e "$TODO_FILE" ]; then
  cp "$TODO_FILE" "$EVIDENCE/$LABEL.store.json"
  rm -f "$EVIDENCE/$LABEL.store.absent"
else
  printf 'absent\n' > "$EVIDENCE/$LABEL.store.absent"
  rm -f "$EVIDENCE/$LABEL.store.json"
fi
before=$(tr -d '[:space:]' < "$EVIDENCE/$LABEL.before")
after=$(tr -d '[:space:]' < "$EVIDENCE/$LABEL.after")
if [ "$before" = "$after" ]; then
  printf 'no\n' > "$EVIDENCE/$LABEL.store-changed"
else
  printf 'yes\n' > "$EVIDENCE/$LABEL.store-changed"
fi
touch "$marker"
exit 0
