# 완료 항목 일괄 삭제

완료 항목 일괄 삭제는 완료된 항목만 지우고, 남은 미완료 항목과 다음 번호는 유지한 채 지운 개수를 보여 준다.

## Sub-features

- `clear-create-empty`는 파일이 없을 때 빈 저장소를 만들고 0개를 지웠다고 알린다.
- `clear-some`은 완료된 항목만 지우고 미완료 항목의 번호를 유지한다.
- `clear-zero`는 완료 항목이 없으면 0개를 알리고 저장 내용을 바꾸지 않는다.

## How to get to it (user POV)

- 터미널에서 `node src/cli.js --file <임시 파일> clear-done`을 실행한다.
- `npm start -- --file <임시 파일> clear-done`으로도 도달한다. 검수 출력 비교는 첫 경로만 쓴다.

## Driving it with todo-verify

Preconditions:

- 새 launch가 exit 0이고 doctor가 `doctor ok`다.
- `$TODO_FILE`이 아직 없다. launch의 `list`는 파일을 만들지 않는다.

- **Clear when the file is absent.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" clear-missing -- clear-done`을 실행한다. `exit:`는 `0`, `store-changed:`는 `yes`, 표준 오류는 비어 있고, 표준 출력은 `완료 항목 0개 삭제`다. 저장 파일은 아래와 같다.

```json
{
  "nextId": 1,
  "tasks": []
}
```

- **Prepare one completed task.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" clear-add-1 -- add 우유 사기`의 표준 출력은 `추가: [ ] 1 우유 사기`다. `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" clear-add-2 -- add 빨래`의 표준 출력은 `추가: [ ] 2 빨래`다. `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" clear-done-1 -- done 1`의 표준 출력은 `완료: [x] 1 우유 사기`다. 셋 다 exit 0이다.
- **Clear completed tasks.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" clear-some -- clear-done`을 실행한다. `exit:`는 `0`, `store-changed:`는 `yes`, 표준 오류는 비어 있고, 표준 출력은 `완료 항목 1개 삭제`다. 저장 파일의 `nextId`는 `3`이고 항목은 2번 `빨래`뿐이며 `done`은 `false`다.
- **List the open task.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" clear-list -- list`의 표준 출력은 `[ ] 2 빨래`이고, `store-changed:`는 `no`다.
- **Clear when none are completed.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" clear-zero -- clear-done`의 표준 출력은 `완료 항목 0개 삭제`이고, `exit:`는 `0`, `store-changed:`는 `no`다.
- **List again.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" clear-list-2 -- list`의 표준 출력은 `[ ] 2 빨래`이고, `store-changed:`는 `no`다.

## Gotchas

- 파일이 없을 때 `clear-done`은 `list`와 달리 빈 저장 파일을 만든다. `store: absent`면 실패다.
- 지운 뒤에도 `nextId`는 줄지 않는다. 2번이 1번으로 다시 매겨지면 실패다.
- 완료가 0개여도 명령은 exit 0이다. 표준 출력의 개수가 0인 것과, 저장 내용이 바뀌지 않은 것을 둘 다 본다.
- 이 사용자 명령의 저장소 검증 명령은 `npm run test:task02`다. 그 테스트 파일은 수정하지 않는다.
