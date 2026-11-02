# 목록 조회

목록 조회는 저장 파일을 바꾸지 않고, 항목이 없으면 `(할 일 없음)`을, 있으면 번호 오름차순으로 한 줄에 하나씩 보여 준다.

## Sub-features

- `list-empty`는 파일이 없을 때 빈 목록을 알리고 파일을 만들지 않는다.
- `list-lines`는 두 항목을 한 줄씩 보여 준다.
- `list-stable`은 같은 목록을 다시 보여 주고 저장 바이트를 바꾸지 않는다.

## How to get to it (user POV)

- 터미널에서 `node src/cli.js --file <임시 파일> list`를 실행한다.
- `npm start -- --file <임시 파일> list`로도 도달한다. 검수 출력 비교는 첫 경로만 쓴다.

## Driving it with todo-verify

Preconditions:

- 새 launch가 exit 0이고 doctor가 `doctor ok`다.
- `$TODO_FILE`이 아직 없다.
- 비어 있지 않은 목록의 선행 항목은 아래 `add` 명령으로 만든다. 그 명령이 기대와 다르면 목록 단계를 통과로 적지 않는다.

- **Empty list.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" list-empty -- list`를 실행한다. `exit:`는 `0`, `store-changed:`는 `no`, 표준 오류는 비어 있고, 표준 출력은 `(할 일 없음)`이다. 저장은 `absent`다.
- **Prepare two tasks.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" list-add-1 -- add 우유 사기`의 표준 출력은 `추가: [ ] 1 우유 사기`이고 exit는 0이다. 이어서 `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" list-add-2 -- add 빨래`의 표준 출력은 `추가: [ ] 2 빨래`이고 exit는 0이다.
- **List both.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" list-lines -- list`를 실행한다. `exit:`는 `0`, `store-changed:`는 `no`, 표준 오류는 비어 있다. 표준 출력은 다음 두 줄이다.

```text
[ ] 1 우유 사기
[ ] 2 빨래
```

- **List again.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" list-again -- list`를 실행한다. 표준 출력과 저장 JSON은 `list-lines`와 같고, `store-changed:`는 `no`다.

## Gotchas

- `(할 일 없음)`은 빈 표준 출력이 아니다. exit는 0이다.
- 파일이 없을 때 `list`는 파일을 만들지 않는다. `store.json`이 생기면 실패다.
- 완료 항목은 `[x]`, 미완료 항목은 `[ ]`다. 대괄호 안 공백을 지우면 다른 형식이다.
- 목록은 저장 바이트를 바꾸지 않는다. `store-changed: no`와 직전 저장 JSON이 같아야 한다.
