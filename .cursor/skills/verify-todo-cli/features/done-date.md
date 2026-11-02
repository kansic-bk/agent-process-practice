# 완료 날짜

완료 날짜는 `done`이 항목을 완료로 표시할 때 `doneOn`에 `YYYY-MM-DD`를 남긴다. `--date`를 주면 그 날짜를 적고, 빼면 세션의 현지 오늘을 적는다. 잘못된 날짜는 저장 파일을 그대로 둔다.

## Sub-features

- `date-set`은 `--date 2026-10-20`으로 1번의 완료 날짜를 적고, 완료 한 줄에는 날짜를 붙이지 않는다.
- `date-list`는 목록에서도 날짜 없이 완료와 미완료를 구분한다.
- `date-bad`는 달력에 없는 날짜를 거절하고 저장 바이트를 그대로 둔다.
- `date-missing`은 `--date` 뒤에 값이 없으면 거절하고 저장 바이트를 그대로 둔다.
- `date-replace`는 이미 완료한 항목의 날짜를 새 값으로 바꾼다.
- `today-done`은 `--date` 없이 현지 오늘을 적는다.
- `today-redo`는 `--date`로 적어 둔 날짜를, 날짜 없이 다시 `done` 하면 오늘로 바꾼다.

## How to get to it (user POV)

- 터미널에서 `node src/cli.js --file <임시 파일> done <번호> --date YYYY-MM-DD`를 실행한다.
- `node src/cli.js --file <임시 파일> done <번호>`는 현지 오늘을 적는다.
- `npm start -- --file <임시 파일> done <번호> --date YYYY-MM-DD`로도 도달한다. 검수 출력 비교는 첫 경로만 쓴다.

## Driving it with todo-verify

Preconditions:

- 새 launch가 exit 0이고 doctor가 `doctor ok`다.
- 아래 `add`가 기대 출력이어야 한다. 아니면 이후 `done`을 통과로 적지 않는다.

- **Prepare tasks.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" date-add-1 -- add 우유 사기`의 표준 출력은 `추가: [ ] 1 우유 사기`다. `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" date-add-2 -- add 빨래`의 표준 출력은 `추가: [ ] 2 빨래`다. 둘 다 exit 0이다.
- **Set a date.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" date-set -- done 1 --date 2026-10-20`을 실행한다. `exit:`는 `0`, `store-changed:`는 `yes`, 표준 오류는 비어 있고, 표준 출력은 `완료: [x] 1 우유 사기`다. 저장 파일에서 1번의 `done`은 `true`, `doneOn`은 `2026-10-20`이다. 2번의 `done`은 `false`이고 `doneOn`은 없다. `nextId`는 `3`이다.
- **List without a date.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" date-list -- list`를 실행한다. `exit:`는 `0`, `store-changed:`는 `no`다. 표준 출력은 다음 두 줄이고, 날짜는 없다.

```text
[x] 1 우유 사기
[ ] 2 빨래
```

- **Reject a calendar miss.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" date-bad -- done 1 --date 2026-02-29`를 실행한다. `exit:`는 `1`, `store-changed:`는 `no`, 표준 출력은 비어 있다. 표준 오류에는 `YYYY-MM-DD`가 있다. 1번의 `doneOn`은 `2026-10-20`이다.
- **Reject a missing value.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" date-missing -- done 1 --date`를 실행한다. `exit:`는 `1`, `store-changed:`는 `no`, 표준 출력은 비어 있다. 표준 오류에는 `YYYY-MM-DD`가 있다. 저장 JSON은 `date-bad` 때와 같다.
- **Replace the date.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" date-replace -- done 1 --date 2026-02-28`을 실행한다. `exit:`는 `0`, `store-changed:`는 `yes`, 표준 오류는 비어 있고, 표준 출력은 `완료: [x] 1 우유 사기`다. 1번의 `doneOn`은 `2026-02-28`이다.

오늘 날짜는 다른 launch에서 확인한다. doctor가 `doctor ok`인 새 id에서, 세션에 `export TZ=Pacific/Kiritimati`를 보낸 다음 아래를 실행한다. tmux 서버가 launch의 환경 변수를 세션에 넘기지 않을 수 있으므로, 시간대는 세션 안에서 export 한다.

- **Prepare one task.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" today-add -- add 오늘 할 일`의 표준 출력은 `추가: [ ] 1 오늘 할 일`이고 exit는 0이다.
- **Stamp today.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" today-done -- done 1`을 실행한다. `exit:`는 `0`, `store-changed:`는 `yes`, 표준 오류는 비어 있고, 표준 출력은 `완료: [x] 1 오늘 할 일`이다. `doneOn`은 그 세션의 `TZ` 기준 오늘 `YYYY-MM-DD`와 같다.
- **Correct back to today.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" today-old -- done 1 --date 2020-01-01`의 표준 출력은 `완료: [x] 1 오늘 할 일`이고, `doneOn`은 `2020-01-01`이다. 이어서 `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" today-redo -- done 1`을 실행한다. `exit:`는 `0`이고 `doneOn`은 다시 그 세션의 오늘과 같다. `2020-01-01`이 남아 있으면 실패다.

## Gotchas

- `done`과 `list`의 표준 출력에는 날짜를 붙이지 않는다. 날짜는 저장 파일의 `doneOn`에만 있다.
- `2026-02-29`는 거절하고 `2026-02-28`은 받는다. 표준 오류에 `YYYY-MM-DD`가 없으면 실패다.
- 거절된 `done`은 저장 바이트를 바꾸지 않는다. `store-changed: yes`면 실패다.
- 오늘 날짜 여정은 `TZ=Pacific/Kiritimati`로 launch한 세션에서만 비교한다. 다른 시간대의 오늘과 맞춰 보면 하루가 밀려 실패로 보인다.
- 미완료 항목에는 `doneOn` 키가 없다.
