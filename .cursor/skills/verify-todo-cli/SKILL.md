---
name: verify-todo-cli
description: "agent-process-practice 할 일 CLI를 임시 저장 파일과 tmux로 사용자처럼 실행해 add, list, done, remove, clear-done을 증명한다. README 기능 지도와 npm test, npm run check, npm run test:taskNN을 확인할 때 쓴다."
---

# 할 일 CLI 검수

이 스킬은 `agent-process-practice`의 사용자 표면인 명령줄 도구를 사람이 치듯이 실행하고, 그 결과와 저장 파일을 증거로 남긴다. 앱은 상주 서버가 아니다. `node src/cli.js` 한 번이 명령 하나다. 라이브러리 함수를 테스트 코드에서 직접 부르는 것은 이 스킬의 운전이 아니다.

저장소 루트에서 실행한다. 루트는 `package.json`의 `name`이 `agent-process-practice`인 디렉터리다. 의존 패키지는 없다. 검수에 npm 패키지를 추가하지 않는다.

검수 중에 `src/`, `test/`, `tasks/tests/`, `package.json`을 고치지 않는다. `report` 명령과 `src/report.js`는 현재 main에 없다. 없는 것을 이 스킬을 돌리다가 구현하지 않는다.

## Launch

준비 도구는 `node`(20 이상), `npm`, `tmux`, `bash`다. README의 확인된 개발 버전은 Node 26.10.0이지만, 이 스킬은 `package.json`의 `engines`와 같이 20 이상이면 된다. doctor가 실제 `node -v`를 남긴다.

저장소 루트에서 한 번:

```bash
npm install
git status --porcelain
```

`npm install`은 exit 0이고, 설치할 패키지가 없어 추적 중인 파일을 바꾸지 않아야 한다. `git status --porcelain`에 `package-lock.json`이나 `todo.json`이 보이면 그 변경을 커밋하지 말고 멈춘다.

각 검수 실행은 자기 저장 파일과 자기 tmux 세션을 가진다. 기본 인자 없이 `launch.sh`를 실행한다.

```bash
set +e
launch_out=$(.cursor/skills/verify-todo-cli/scripts/launch.sh)
launch_status=$?
printf '%s\n' "$launch_out"
if [ "$launch_status" -ne 0 ]; then
  echo "launch failed" >&2
  exit "$launch_status"
fi
set -e
RUN_ID=$(printf '%s\n' "$launch_out" | sed -n 's/^export RUN_ID=//p')
test -n "$RUN_ID"
```

`set -e`는 이 블록 이후의 명령이 실패하면 멈추게 한다.

`launch.sh`가 하는 일은 다음과 같다.

- 데이터 디렉터리 `/tmp/todo-cli-verify-data-$RUN_ID/`와 저장 파일 경로 `/tmp/todo-cli-verify-data-$RUN_ID/todo.json`을 만든다. 시작할 때 그 파일은 없다.
- 증거 디렉터리 `/tmp/todo-cli-verify-evidence-$RUN_ID/`를 만든다. cleanup이 이 디렉터리를 지우지 않는다.
- 저장소 루트를 작업 디렉터리로 하는 tmux 세션 `todo-cli-verify-$RUN_ID`를 띄운다.
- 그 세션 안에서 `node src/cli.js --file <그 todo.json> list`를 실행한다.

준비 완료는 프로세스가 떠 있다는 뜻이 아니다. 목록 명령이 쓸 수 있는 빈 저장소여야 한다. `launch.sh`가 exit 0이 되려면 그 `list`의 표준 출력이 `(할 일 없음)` 한 줄이고, 표준 오류가 비어 있고, exit가 0이고, `todo.json`이 아직 없어야 한다. 출력 끝의 `export RUN_ID=` 줄이 이번 실행의 id다. 같은 id로 다시 launch하지 않는다. 증거 디렉터리를 덮어쓰지 않기 위해서다.

실패하면 `launch.sh`가 자기가 만든 세션과 데이터 디렉터리만 치우고 증거 디렉터리는 남긴다. 표준 오류의 `evidence kept at` 경로를 본 뒤, 필요하면 그 id로 `cleanup.sh`를 다시 실행하고, 새 launch를 한다.

두 실행은 나란히 둘 수 있다. id가 다르면 세션 이름과 `--file` 경로가 다르다. 공유하는 `./todo.json`은 운전하지 않는다. `--file`을 생략하면 현재 디렉터리의 `todo.json`을 읽고, 내용을 바꾸는 명령은 그 파일에 쓴다. 그 파일은 `.gitignore`에 있다. 검수는 항상 launch가 만든 임시 파일만 쓴다.

저장이 나뉘는지 확인할 때는 launch를 두 번 한다. 첫 실행의 id를 `RUN_ID_A`, 둘째를 `RUN_ID_B`로 둔다.

```bash
.cursor/skills/verify-todo-cli/scripts/doctor.sh "$RUN_ID_A"
.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID_A" side-add -- add A만
set +e
launch_out=$(.cursor/skills/verify-todo-cli/scripts/launch.sh)
launch_status=$?
printf '%s\n' "$launch_out"
if [ "$launch_status" -ne 0 ]; then
  echo "launch failed" >&2
  exit "$launch_status"
fi
set -e
RUN_ID_B=$(printf '%s\n' "$launch_out" | sed -n 's/^export RUN_ID=//p')
test -n "$RUN_ID_B"
.cursor/skills/verify-todo-cli/scripts/doctor.sh "$RUN_ID_B"
.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID_B" side-add -- add B만
.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID_A" side-list -- list
.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID_B" side-list -- list
```

A의 목록은 `[ ] 1 A만`만, B의 목록은 `[ ] 1 B만`만 나와야 한다. 그 다음 두 id에 대해 Cleanup을 각각 실행한다.

## Doctor

기능을 운전하기 전에, 그리고 드라이브가 실패해서 원인을 모를 때, doctor를 실행한다.

```bash
.cursor/skills/verify-todo-cli/scripts/doctor.sh "$RUN_ID"
```

exit 0이고 마지막 의미 있는 줄이 `doctor ok`여야 한다. doctor는 저장 파일을 만들거나 고치지 않는다. 통과 조건은 다음과 같다.

- tmux 세션 `todo-cli-verify-$RUN_ID`가 살아 있고, 그 창의 현재 디렉터리가 이 저장소 루트다.
- `node`의 주 버전이 20 이상이다.
- `package.json`의 이름이 `agent-process-practice`다.
- `src/**/*.js`가 `node --check`를 통과한다. 현재 main의 파일은 `src/cli.js`, `src/stats.js`, `src/storage.js`, `src/todo.js`다.
- 그 파일들의 sha256이 launch 때 적어 둔 `$EVIDENCE/src.sha256`과 같다. 소스를 고쳤으면 새 launch가 필요하다.
- 저장 경로가 `/tmp/todo-cli-verify-data-$RUN_ID/todo.json`이고, 저장소 안의 파일이 아니며, 심볼릭 링크가 아니다.
- `node src/cli.js --file <그 경로> fly`가 exit 1이고, 표준 오류에 `사용법: node src/cli.js [--file <경로>] <명령> [인자]`가 있으며, 저장 파일의 내용과 존재 여부가 그대로다.

하나라도 어긋나면 exit 1이고 첫 진단 줄은 `doctor fail:`이다. doctor가 실패한 세션은 운전하지 않는다. 세션을 cleanup하고 고친 뒤 새 id로 launch한다.

## Drive

기능 지도는 `features/README.md`다. 증명할 기능의 파일을 열고, `Driving it with todo-verify`의 항목을 위에서 아래로 모두 실행한다. 한 항목이 됐다고 다른 진입점을 통과로 적지 않는다.

```bash
.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" <label> -- <cli 인자>
```

이 명령은 세션 안에서 다음을 실행하고, 같은 내용을 표준 출력으로 보여 준다.

```text
node src/cli.js --file /tmp/todo-cli-verify-data-$RUN_ID/todo.json <cli 인자>
```

`drive.sh`의 exit 0은 "CLI가 기대대로 성공했다"가 아니라 "명령을 세션에서 끝까지 실행하고 증거를 썼다"이다. CLI가 일부러 exit 1인 단계도 `drive.sh`는 0으로 끝난다. 기능 파일이 말하는 exit는 출력의 `exit:` 값이다. `drive.sh`가 0이 아니면 그 단계는 실행되지 않은 것이다. 타임아웃이면 증거 디렉터리의 `<label>.pane.txt`와 세션을 보고, cleanup한 뒤 새 id로 다시 한다.

인자로 `--file`을 넘기지 않는다. 넘기면 `drive.sh`가 거부한다. 저장 위치는 그 실행의 임시 파일뿐이다.

빈 저장소에서 시작해야 하는 기능은 방금 launch한 id에서만 돌린다. 이미 항목을 넣은 id로 다른 기능의 기대 출력을 맞추지 않는다. 기능마다 새 launch와 새 doctor를 쓴다.

사용자 진입점은 두 가지다.

- `node src/cli.js --file <임시 파일> <명령> [인자]`
- `npm start -- --file <임시 파일> <명령> [인자]`

검수 명령은 `node src/cli.js`다. `npm start`는 같은 CLI를 부르지만 npm이 스크립트 이름을 표준 출력에 붙여, 기대하는 한 줄과 바이트가 달라진다.

저장 파일을 검수자가 직접 고쳐 깨진 JSON을 만들지 않는다. 깨진 파일을 만나면 어느 명령이든 exit 1이고, 표준 오류는 JSON 파서 메시지이며, 파일 바이트는 그대로다. 그 상태에서 파일이 덮어써지면 실패다.

`list`는 파일을 만들지 않는다. 내용이 비어 거절된 `add`, 없는 번호를 `done`하거나 `remove`하는 명령도 파일이 없었으면 그대로 두지 않는다. `clear-done`은 지울 완료 항목이 0개여도 저장 함수를 호출하므로, 파일이 없으면 빈 저장소를 새로 만든다.

## Evidence

증거 디렉터리는 `/tmp/todo-cli-verify-evidence-$RUN_ID/`다. 데이터 디렉터리와 이름이 겹치지 않는다. cleanup 뒤에도 이 디렉터리가 남아 있어야 한다.

드라이브 한 번의 파일은 다음과 같다.

- `<label>.cmd` — 저장소 루트에서 실행한 `node src/cli.js --file ...` 한 줄
- `<label>.stdout`, `<label>.stderr`, `<label>.exit`
- `<label>.before`, `<label>.after` — 명령 전후 저장 파일의 sha256. 파일이 없으면 `ABSENT`
- `<label>.store-changed` — 내용 또는 존재 여부가 바뀌면 `yes`, 아니면 `no`. 같은 바이트를 다시 쓰는 것은 `no`다
- `<label>.store.json` 또는 `<label>.store.absent`
- `doctor.txt`, `src.sha256`, `session.env`, `node-version.txt`

증명에는 명령과 결과 상태를 둘 다 남긴다. 표준 출력만으로 저장을 단정하지 않는다. 항목을 넣는 명령은 이어서 `list`를 실행하고, `list`의 표준 출력과 `<label>.store.json`이 같은 항목을 가리켜야 한다. 외부 서비스가 없어 mock은 쓰지 않는다. 임시 파일에 쓰는 것이 이 CLI의 실제 저장이다.

기능 파일이 요구하는 선행 상태가 없으면 그 항목은 실패한 것이다. 다른 경로로 돌아 통과라고 적지 말고, 시도한 명령과 없던 조건을 그 기능의 Gotchas에 맞게 보고한다.

## Cleanup

이 실행이 띄운 세션만 끝내고, 그 실행의 데이터 디렉터리만 지운다. `pkill`, `killall`, 프로세스 이름으로 죽이지 않는다. `todo-cli-verify-*` 글롭으로 지우지 않는다. 그 글롭은 증거 디렉터리와 다른 실행까지 닿는다.

```bash
.cursor/skills/verify-todo-cli/scripts/cleanup.sh "$RUN_ID"
test -d "/tmp/todo-cli-verify-evidence-$RUN_ID"
test ! -d "/tmp/todo-cli-verify-data-$RUN_ID"
if tmux has-session -t "todo-cli-verify-$RUN_ID" 2>/dev/null; then
  echo "session still alive" >&2
  exit 1
fi
```

`cleanup.sh`는 세션이 이미 없어도 된다. 증거 디렉터리가 없으면 exit 1이다. 실패한 시도 뒤에도 같은 명령을 실행해 세션과 임시 저장 파일을 남기지 않는다. 증거 파일은 그 다음에도 읽혀야 한다. 저장소 루트에 `todo.json`이 새로 생겼으면 그 검수는 잘못된 경로를 쓴 것이다. 그 파일을 기능 구현으로 취급하지 말고 지우고, `--file`이 임시 경로였는지 확인한다.

## Helpers

스크립트는 저장소 루트 기준 경로다. 모두 실행 비트로 둔다. `lib.sh`만 직접 실행하지 않는다.

```bash
.cursor/skills/verify-todo-cli/scripts/launch.sh
.cursor/skills/verify-todo-cli/scripts/doctor.sh "$RUN_ID"
.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" <label> -- <cli 인자>
.cursor/skills/verify-todo-cli/scripts/cleanup.sh "$RUN_ID"
```

`drive.sh`가 tmux 세션에 넣는 명령은 다음 형태다.

```text
cd <저장소 루트> && RUN_ID=<id> LABEL=<label> .cursor/skills/verify-todo-cli/scripts/session-run.sh -- <cli 인자>
```

`session-run.sh`는 그 세션 안에서 CLI를 한 번 실행하고 증거 파일을 쓴 뒤 exit 0으로 끝난다. CLI의 exit는 `$EVIDENCE/<label>.exit`에 있다. 세션 밖에서 `session-run.sh`를 직접 호출하지 않는다.

`lib.sh`는 위 스크립트가 source한다. 직접 실행하면 exit 1이고, 표준 오류에 source해서 쓰라는 문장이 나온다.

`drive.sh`의 표준 출력 형식은 고정이다.

```text
label: <label>
command: node src/cli.js --file <임시 todo.json> <인자>
exit: <CLI exit>
store-changed: yes|no
--- stdout ---
<표준 출력. 없으면 바로 다음 구분 줄>
--- stderr ---
<표준 오류. 없으면 바로 다음 구분 줄>
--- store ---
<저장 JSON 또는 absent>
```

공백이 있거나 ASCII가 아닌 인자는 `command:` 줄에서 작은따옴표로 묶인다. `add '  우유 사기 '`는 인자 하나가 공백 두 칸, `우유 사기`, 공백 한 칸이다.

## README 기능 지도

README의 `## 기능 지도` 표는 기능 이름, 파일, 함수, 검증 명령을 적는다. `npm run check`는 그 파일과 export된 함수가 있는지만 본다. CLI를 사용자처럼 실행하지는 않는다. 사용자 명령과의 대응은 아래와 같다. 기능 파일은 `.cursor/skills/verify-todo-cli/features/` 아래다.

| README 기능 | 파일 | 함수 | README 검증 명령 | 사용자 명령 | 기능 파일 |
|---|---|---|---|---|---|
| 빈 저장소 만들기 | `src/todo.js` | `createStore` | `npm test` | 파일이 없을 때의 `list` | `list-tasks.md` |
| 할 일 추가 | `src/todo.js` | `addTask` | `npm test` | `add` | `add-task.md` |
| 목록 조회 | `src/todo.js` | `listTasks` | `npm test` | `list` | `list-tasks.md` |
| 번호로 찾기 | `src/todo.js` | `findTask` | `npm test` | `done`, `remove`가 번호를 찾을 때 | `complete-task.md`, `remove-task.md` |
| 완료 처리 | `src/todo.js` | `completeTask` | `npm test` | `done` | `complete-task.md` |
| 삭제 | `src/todo.js` | `removeTask` | `npm test` | `remove` | `remove-task.md` |
| 완료 항목 일괄 삭제 | `src/todo.js` | `clearCompleted` | `npm run test:task02` | `clear-done` | `clear-done.md` |
| 한 줄 표시 형식 | `src/todo.js` | `formatTask` | `npm test` | `add`, `list`, `done`, `remove`의 한 줄 | 해당 기능 파일 |
| 저장 파일 읽기 | `src/storage.js` | `loadStore` | `npm test` | 모든 명령 | 모든 기능 파일 |
| 저장 파일 쓰기 | `src/storage.js` | `saveStore` | `npm test` | `add`, `done`, `remove`, `clear-done` | 해당 기능 파일 |
| 명령줄 인자 해석 | `src/cli.js` | `parseArgs` | `npm test` | `--file`과 명령 | 모든 기능 파일 |
| 명령 실행(진입점) | `src/cli.js` | `run` | `npm test` | `node src/cli.js` | 모든 기능 파일 |
| 개수 집계 | `src/stats.js` | `summarize` | `npm run test:task03` | 없음 | 없음 |

`개수 집계`는 CLI 명령이 아니다. `npm run test:task03`으로만 확인한다. README의 `## removeTask 사용법`은 같은 삭제를 함수로 부르는 예다. 사용자 검수 경로는 `remove` 명령이다.

`완료 항목 날짜별 보고` 행은 현재 README 표에 없다. `tasks/TASK-04.md`의 `report`는 아직 사용자 명령이 아니므로 기능 지도에 넣지 않는다.

## 저장소 검사

CLI 운전과 별도로, 저장소 루트에서 다음을 실행한다. `node --test`를 인자 없이 실행하지 않는다. 과제 테스트까지 잡아 `test:task04` 때문에 실패로 보인다. 테스트는 아래 npm 스크립트만 쓴다.

| 명령 | 현재 main의 exit | 기대 |
|---|---|---|
| `npm test` | 0 | `test/todo.test.js`와 `test/cli.test.js`만 실행한다 |
| `npm run check` | 0 | 마지막 줄이 `check 통과: 기능 지도·문법·과제 파일 모두 정상` |
| `npm run test:task02` | 0 | 완료 항목 일괄 삭제가 구현되어 있다 |
| `npm run test:task03` | 0 | `summarize`가 구현되어 있다 |
| `npm run test:task04` | 1 | `src/report.js`가 없어 `ERR_MODULE_NOT_FOUND`다. 출력에 `src/report.js`가 있다 |

`test:task04`의 exit 1은 현재 main의 정상 상태다. 검수 중에 구현하거나 테스트를 고치지 않는다.

## Maintenance

기능이 바뀌면 `/maintain-verification-skill`로 이 스킬과 `features/`를 소스와 실제 실행에 맞춰 고친다. 지도에 없는 사용자 명령을 통과로 적지 않는다.
