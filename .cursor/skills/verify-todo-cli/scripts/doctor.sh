#!/usr/bin/env bash
# Usage: doctor.sh RUN_ID
# Read-only check that this run is worth driving. Does not create or modify the store file.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

if [ "$#" -ne 1 ]; then
  echo "usage: doctor.sh RUN_ID" >&2
  exit 1
fi
load_run "$1"

report=""
fail() {
  printf 'doctor fail: %s\n' "$1" | tee "$EVIDENCE/doctor.txt" >&2
  exit 1
}
add() {
  report+="$1"$'\n'
}

if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  fail "tmux session $SESSION is not running"
fi
add "ok tmux $SESSION"

pane=$(tmux display-message -p -t "$SESSION:0.0" '#{pane_current_path}')
if [ "$(node_realpath "$pane")" != "$(node_realpath "$REPO_ROOT")" ]; then
  fail "tmux cwd is $pane, expected $REPO_ROOT"
fi
add "ok pane-cwd $pane"

node_version=$(node -v)
node_major=$(node -e 'process.stdout.write(String(process.versions.node.split(".")[0]))')
if [ "$node_major" -lt 20 ]; then
  fail "node $node_version is older than 20"
fi
add "ok node $node_version"

add "ok package agent-process-practice"

while IFS= read -r rel; do
  if ! node --check "$REPO_ROOT/$rel"; then
    fail "syntax error in $rel"
  fi
  add "ok syntax $rel"
done < <(list_src_js)

if ! cmp -s "$EVIDENCE/src.sha256" <(hash_sources); then
  fail "src/*.js hash does not match the hash recorded at launch"
fi
add "ok source-hash"

before=$(store_stamp "$TODO_FILE")
fly_out="$DATA_DIR/doctor-fly.stdout"
fly_err="$DATA_DIR/doctor-fly.stderr"
set +e
node "$REPO_ROOT/src/cli.js" --file "$TODO_FILE" fly >"$fly_out" 2>"$fly_err"
fly_status=$?
set -e
after=$(store_stamp "$TODO_FILE")
if [ "$before" != "$after" ]; then
  fail "usage probe changed the store"
fi
if [ "$fly_status" -ne 1 ]; then
  fail "usage probe exit was $fly_status, expected 1"
fi
if ! grep -F -q '사용법: node src/cli.js [--file <경로>] <명령> [인자]' "$fly_err"; then
  fail "usage probe stderr did not contain the usage line"
fi
add "ok store-path $TODO_FILE"
add "ok usage-exit 1"
add "ok store-unchanged"
add "doctor ok"

printf '%s\n' "$report" | tee "$EVIDENCE/doctor.txt"
