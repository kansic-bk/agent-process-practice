# 완료 보고

완료 보고는 완료한 항목만 저장된 날짜별로 보여 준다. 저장 파일을 만들거나 바꾸지 않고, 같은 파일이면 시간대가 달라도 출력이 같다.

## Sub-features

- `report-empty`는 파일이 없을 때 완료 항목이 없다고 알리고 파일을 만들지 않는다.
- `report-lines`는 완료 항목을 날짜 오름차순으로 묶고, 미완료 항목은 빼며, 각 줄을 공백 두 칸과 한 줄 표시 형식으로 보여 준다.
- `report-stable`은 시간대를 바꿔 같은 파일을 다시 읽어도 출력과 저장 바이트가 같다.

## How to get to it (user POV)

- 터미널에서 `node src/cli.js --file <임시 파일> report`를 실행한다.
- `npm start -- --file <임시 파일> report`로도 도달한다. 검수 출력 비교는 첫 경로만 쓴다.

## Driving it with todo-verify

Preconditions:

- 새 launch가 exit 0이고 doctor가 `doctor ok`다.
- `$TODO_FILE`이 아직 없다.
- 날짜가 있는 항목은 아래 `add`와 `done --date`로 만든다. 그 명령이 기대와 다르면 보고 단계를 통과로 적지 않는다.

- **Empty report.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" report-empty -- report`를 실행한다. `exit:`는 `0`, `store-changed:`는 `no`, 표준 오류는 비어 있고, 표준 출력은 `(완료한 할 일 없음)`이다. 저장은 `absent`다.
- **Prepare tasks.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" report-add-1 -- add 우유 사기`의 표준 출력은 `추가: [ ] 1 우유 사기`다. `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" report-add-2 -- add 빨래`의 표준 출력은 `추가: [ ] 2 빨래`다. `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" report-add-3 -- add 청소`의 표준 출력은 `추가: [ ] 3 청소`다. 셋 다 exit 0이다.
- **Date two tasks.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" report-done-1 -- done 1 --date 2026-10-20`의 표준 출력은 `완료: [x] 1 우유 사기`다. `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" report-done-3 -- done 3 --date 2026-10-22`의 표준 출력은 `완료: [x] 3 청소`다. 둘 다 exit 0이다. 2번은 미완료로 남는다.
- **Report the groups.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" report-lines -- report`를 실행한다. `exit:`는 `0`, `store-changed:`는 `no`, 표준 오류는 비어 있다. 표준 출력은 다음 네 줄이다.

```text
2026-10-20 (1개)
  [x] 1 우유 사기
2026-10-22 (1개)
  [x] 3 청소
```

- **Same file, other zones.** 세션에 `export TZ=Asia/Seoul`을 보낸 뒤 `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" report-seoul -- report`를 실행한다. 이어서 `export TZ=Pacific/Pago_Pago`를 보낸 뒤 `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" report-pago -- report`를 실행한다. 두 표준 출력은 `report-lines`와 같고, 둘 다 `exit:`는 `0`, `store-changed:`는 `no`다.

## Gotchas

- `(완료한 할 일 없음)`은 빈 표준 출력이 아니다. exit는 0이다.
- 파일이 없을 때 `report`는 파일을 만들지 않는다. `store.json`이 생기면 실패다.
- 미완료 항목은 보고에 나오지 않는다. 2번 `빨래`가 보이면 실패다.
- 항목 줄은 공백 두 칸으로 시작한다. 한 칸이면 실패다.
- 시간대를 바꿔도 머리줄의 날짜 문자는 저장 파일과 같다. 하루가 밀리면 실패다.
- 날짜가 없는 완료 항목의 `날짜 없음` 묶음은 이 운전에서 만들지 않는다. 예전 저장 파일은 `npm run test:task04`가 본다.
