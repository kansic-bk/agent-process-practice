#!/usr/bin/env bash
# Shared helpers for verify-todo-cli. Source from the other scripts. Do not run directly.
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  echo "lib.sh is sourced by launch.sh, doctor.sh, drive.sh, session-run.sh, and cleanup.sh" >&2
  exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../../../.." && pwd)

if ! command -v node >/dev/null 2>&1; then
  echo "node is required (package.json engines: >=20)" >&2
  exit 1
fi
if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is required to drive the CLI in an isolated session" >&2
  exit 1
fi

package_name=$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).name)' -- "$REPO_ROOT/package.json")
if [ "$package_name" != "agent-process-practice" ]; then
  echo "refusing to run: $REPO_ROOT is package '$package_name', not agent-process-practice" >&2
  exit 1
fi

validate_run_id() {
  case "$1" in
    ""|*[!A-Za-z0-9._-]*)
      echo "RUN_ID must match [A-Za-z0-9._-]+" >&2
      return 1
      ;;
  esac
}

data_dir_for() {
  printf '/tmp/todo-cli-verify-data-%s' "$1"
}

evidence_dir_for() {
  printf '/tmp/todo-cli-verify-evidence-%s' "$1"
}

session_name_for() {
  printf 'todo-cli-verify-%s' "$1"
}

node_realpath() {
  node -e 'console.log(require("fs").realpathSync(process.argv[1]))' -- "$1"
}

path_inside_repo() {
  local real root
  real=$(node_realpath "$1")
  root=$(node_realpath "$REPO_ROOT")
  case "$real" in
    "$root"|"$root"/*) return 0 ;;
    *) return 1 ;;
  esac
}

assert_run_paths() {
  local run_id=$1
  local data evidence
  data=$(data_dir_for "$run_id")
  evidence=$(evidence_dir_for "$run_id")
  if [ "$data" = "$evidence" ]; then
    echo "data dir and evidence dir are the same path" >&2
    return 1
  fi
  case "$data" in
    /tmp/todo-cli-verify-data-*) ;;
    *)
      echo "refusing data dir $data" >&2
      return 1
      ;;
  esac
  case "$evidence" in
    /tmp/todo-cli-verify-evidence-*) ;;
    *)
      echo "refusing evidence dir $evidence" >&2
      return 1
      ;;
  esac
  if [ -L "$data" ] || [ -L "$evidence" ]; then
    echo "refusing symlink in verification paths" >&2
    return 1
  fi
  if [ -d "$data" ] && path_inside_repo "$data"; then
    echo "data dir resolves inside the repo: $data" >&2
    return 1
  fi
  if [ -e "$data/todo.json" ]; then
    if [ -L "$data/todo.json" ]; then
      echo "refusing symlink store file" >&2
      return 1
    fi
    if path_inside_repo "$data/todo.json"; then
      echo "store file resolves inside the repo" >&2
      return 1
    fi
  fi
}

load_run() {
  local want=$1
  local env_file data evidence session store
  validate_run_id "$want" || return 1
  data=$(data_dir_for "$want")
  evidence=$(evidence_dir_for "$want")
  session=$(session_name_for "$want")
  store="$data/todo.json"
  env_file="$evidence/session.env"
  if [ ! -f "$env_file" ]; then
    echo "missing $env_file (run launch.sh first)" >&2
    return 1
  fi
  # shellcheck disable=SC1090
  source "$env_file"
  if [ "$RUN_ID" != "$want" ] || [ "$DATA_DIR" != "$data" ] || [ "$EVIDENCE" != "$evidence" ] || [ "$SESSION" != "$session" ] || [ "$TODO_FILE" != "$store" ] || [ "$ROOT" != "$REPO_ROOT" ]; then
    echo "session.env does not match this checkout and RUN_ID $want" >&2
    return 1
  fi
  assert_run_paths "$want" || return 1
}

list_src_js() {
  (cd "$REPO_ROOT" && find src -name '*.js' -type f | sort)
}

hash_sources() {
  local files=()
  local f
  while IFS= read -r f; do
    files+=("$f")
  done < <(list_src_js)
  if [ "${#files[@]}" -eq 0 ]; then
    echo "no src/*.js files to hash" >&2
    return 1
  fi
  (cd "$REPO_ROOT" && node -e '
    const fs = require("fs");
    const crypto = require("crypto");
    for (const file of process.argv.slice(1)) {
      const data = fs.readFileSync(file);
      const hash = crypto.createHash("sha256").update(data).digest("hex");
      process.stdout.write(hash + "  " + file + "\n");
    }
  ' -- "${files[@]}")
}

store_stamp() {
  local target=$1
  if [ -e "$target" ]; then
    node -e 'const fs=require("fs"); const crypto=require("crypto"); const bytes=fs.readFileSync(process.argv[1]); process.stdout.write(crypto.createHash("sha256").update(bytes).digest("hex"));' -- "$target"
  else
    printf 'ABSENT'
  fi
}

shell_quote() {
  local out="" s escaped
  for s in "$@"; do
    if [[ "$s" =~ ^[A-Za-z0-9._@%+=:,/-]+$ ]]; then
      out+="$s "
    else
      escaped=${s//\'/\'\\\'\'}
      out+="'$escaped' "
    fi
  done
  printf '%s' "${out% }"
}
