# 할 일 추가

할 일 추가는 사용자가 내용을 한 항목으로 저장하고, 빈 내용은 거절하며, 저장한 내용을 목록에서 다시 보게 한다.

## Sub-features

- `add-empty`는 내용이 없는 `add`를 거절하고 파일을 만들지 않는다.
- `add-blank`는 공백만 있는 내용을 거절하고 파일을 만들지 않는다.
- `add-trim`은 앞뒤 공백을 뺀 내용으로 1번 항목을 만든다.
- `add-second`는 다음 번호로 두 번째 항목을 만든다.
- `add-list`는 저장본을 목록 명령으로 다시 읽는다.

## How to get to it (user POV)

- 터미널에서 `node src/cli.js --file <임시 파일> add <내용>`을 실행한다.
- `npm start -- --file <임시 파일> add <내용>`으로도 같은 명령에 도달한다. 검수 출력 비교는 첫 경로만 쓴다.

## Driving it with todo-verify

Preconditions:

- 새 launch가 exit 0이고 doctor가 `doctor ok`다.
- `$TODO_FILE`이 아직 없다.

- **Reject an empty add.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" add-empty -- add`를 실행한다. `exit:`는 `1`, `store-changed:`는 `no`, 표준 출력은 비어 있고, 표준 오류는 `할 일 내용이 비어 있습니다`다. 저장은 `absent`다.
- **Reject a blank add.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" add-blank -- add "   "`를 실행한다. `command:` 줄의 인자는 `add '   '`다. `exit:`는 `1`, `store-changed:`는 `no`, 표준 출력은 비어 있고, 표준 오류는 `할 일 내용이 비어 있습니다`다. 저장은 `absent`다.
- **Trim and save.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" add-trim -- add "  우유 사기 "`를 실행한다. `command:` 줄의 인자는 `add '  우유 사기 '`다. `exit:`는 `0`, `store-changed:`는 `yes`, 표준 오류는 비어 있고, 표준 출력은 `추가: [ ] 1 우유 사기`다. 저장 파일은 아래와 같다.

```json
{
  "nextId": 2,
  "tasks": [
    {
      "id": 1,
      "text": "우유 사기",
      "done": false
    }
  ]
}
```

- **Add a second task.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" add-second -- add 빨래`를 실행한다. `exit:`는 `0`, `store-changed:`는 `yes`, 표준 오류는 비어 있고, 표준 출력은 `추가: [ ] 2 빨래`다. 저장 파일의 `nextId`는 `3`이고, 1번 내용은 `우유 사기`, 2번 내용은 `빨래`이며 둘 다 `done`은 `false`다.
- **Read it back.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" add-list -- list`를 실행한다. `exit:`는 `0`, `store-changed:`는 `no`, 표준 오류는 비어 있다. 표준 출력은 다음 두 줄이다.

```text
[ ] 1 우유 사기
[ ] 2 빨래
```

저장 JSON은 직전 `add-second`의 저장 JSON과 같다.

## Gotchas

- 단어를 여러 개 주면 공백으로 이어 한 항목이 된다. `add 우유 사기`는 항목 하나다.
- 저장되는 내용은 앞뒤 공백을 뺀 문자열이다. 표준 출력의 한 줄도 그 문자열을 보여 준다.
- 빈 내용 거절은 파일을 만들지 않는다. 파일이 생기면 이 항목은 실패다.
- `--file`을 빼면 저장소의 `./todo.json`에 쓴다. `drive.sh`에 `--file`을 다시 넘기지 않는다.
