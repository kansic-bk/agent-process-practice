# 할 일 CLI 검수 지도

이 디렉터리는 `agent-process-practice` 할 일 CLI의 사용자 동작을 검수하는 기준이다. 색인을 먼저 읽고, 해당 기능 파일의 명령을 그대로 실행한다.

## Baseline preconditions

- 저장소 루트에서 `npm install`이 exit 0이다. 추적 중인 파일을 바꾸지 않는다.
- `node` 20 이상과 `tmux`가 있다.
- `.cursor/skills/verify-todo-cli/scripts/launch.sh`가 exit 0이다. 데이터 디렉터리는 `/tmp/todo-cli-verify-data-$RUN_ID/`, 저장 파일은 그 안의 `todo.json`, 증거는 `/tmp/todo-cli-verify-evidence-$RUN_ID/`, tmux 세션은 `todo-cli-verify-$RUN_ID`다.
- launch 직후 `todo.json`은 없고, `list`의 표준 출력은 `(할 일 없음)`이다.
- `.cursor/skills/verify-todo-cli/scripts/doctor.sh "$RUN_ID"`가 exit 0이고 `doctor ok`다.
- 이번 launch가 만든 세션만 운전한다. 저장소의 `./todo.json`은 쓰지 않는다.

## Driving conventions

- 기대 상태가 빈 저장소인 기능은 새 `RUN_ID`에서 시작한다.
- 명령은 기능 파일에 적힌 그대로 실행한다. 따옴표와 공백을 바꾸지 않는다.
- 운전 명령은 `.cursor/skills/verify-todo-cli/scripts/drive.sh`다. 그 명령이 tmux 세션에서 `node src/cli.js --file <임시 todo.json>`을 실행한다.
- `drive.sh`의 exit 0은 증거를 썼다는 뜻이다. 기능 파일이 말하는 exit는 출력의 `exit:` 값이다.
- `npm start -- --file ...`도 사용자 진입점이지만, npm이 스크립트 이름을 출력에 붙인다. 기대 출력과 비교하는 운전은 `node src/cli.js`만 쓴다.
- 항목을 바꾼 뒤에는 저장 JSON과 이어지는 `list`를 둘 다 본다.
- cleanup은 데이터 디렉터리와 그 세션만 지운다. 증거 디렉터리는 남긴다.

## Proof and skip reporting

- 명령, 표준 출력, 표준 오류, exit, 저장 파일의 전후를 모두 남긴다.
- 표준 출력만으로 저장됐다고 하지 않는다.
- 기능 파일의 선행 조건이 없으면, 시도한 명령과 없던 조건을 적고 그 항목은 실패다.
- 실행하지 않은 진입점을 다른 경로로 통과했다고 적지 않는다.
- `report`와 `done --date`는 사용자 명령이다. `report.md`와 `done-date.md`의 운전을 모두 실행한다. 저장 파일을 검수자가 고쳐 날짜 없는 완료 항목을 만들지 않는다. 그 묶음은 `npm run test:task04`가 본다.

## Feature entry contract

각 기능 파일은 H1과, 사용자가 보는 동작을 설명하는 문단 하나로 시작한다. 그 다음 H2는 아래 네 개뿐이고 이 순서를 지킨다.

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with todo-verify`
4. `Gotchas`

## Features

- [할 일 추가](./add-task.md)는 `add`로 항목을 만들고, 빈 내용을 거절하고, 저장 파일을 다시 읽는다.
- [목록 조회](./list-tasks.md)는 빈 목록과 두 항목 목록을 보여주고, 목록 조회가 저장 파일을 바꾸지 않는지 본다.
- [완료 처리](./complete-task.md)는 `done`으로 완료 표시를 하고, 잘못된 번호를 거절한다.
- [할 일 삭제](./remove-task.md)는 `remove`로 한 항목을 지우고, 지운 번호를 다시 쓰지 않는지 본다.
- [완료 항목 일괄 삭제](./clear-done.md)는 `clear-done`으로 완료 항목만 지운다.
- [완료 날짜](./done-date.md)는 `done --date YYYY-MM-DD`로 완료 날짜를 적고, 잘못된 날짜는 파일을 그대로 둔다.
- [완료 보고](./report.md)는 `report`로 완료 항목을 날짜별로 보여 주고, 시간대가 달라도 같은 파일은 같은 출력을 낸다.

README `## 기능 지도`의 기능 열과의 연결이다. 파일과 함수 이름은 상위 `SKILL.md`의 표에 있다.

| 기능 파일 | 사용자 명령 | README 기능 열 | README 검증 명령 |
|---|---|---|---|
| `add-task.md` | `add` | 할 일 추가, 한 줄 표시 형식, 저장 파일 쓰기, 명령줄 인자 해석, 명령 실행(진입점) | `npm test` |
| `list-tasks.md` | `list` | 목록 조회, 빈 저장소 만들기, 저장 파일 읽기, 한 줄 표시 형식 | `npm test` |
| `complete-task.md` | `done` | 완료 처리, 번호로 찾기, 저장 파일 쓰기 | `npm test` |
| `remove-task.md` | `remove` | 삭제, 번호로 찾기, 저장 파일 쓰기 | `npm test` |
| `clear-done.md` | `clear-done` | 완료 항목 일괄 삭제 | `npm run test:task02` |
| `done-date.md` | `done --date` | 완료 처리 | `npm test`, `npm run test:task04` |
| `report.md` | `report` | 완료 항목 날짜별 보고 | `npm run test:task04` |

`개수 집계`는 사용자 명령이 없다. `npm run test:task03`으로 확인한다.
