# 할 일 삭제

할 일 삭제는 번호로 항목 하나를 지우고 지운 항목을 보여 준다. 지운 번호는 다음 추가에서 다시 쓰지 않는다.

## Sub-features

- `remove-one`은 2번 항목을 지우고 남은 1번만 목록에 둔다.
- `remove-keep-id`는 다음 추가의 번호를 3으로 붙인다.
- `remove-missing`은 없는 번호와 빠뜨린 번호를 거절하고 저장 파일을 그대로 둔다.

## How to get to it (user POV)

- 터미널에서 `node src/cli.js --file <임시 파일> remove <번호>`를 실행한다.
- `npm start -- --file <임시 파일> remove <번호>`로도 도달한다. 검수 출력 비교는 첫 경로만 쓴다.
- README의 `removeTask` 절은 같은 삭제를 함수로 부르는 설명이다. 이 파일의 운전 경로는 CLI의 `remove`다.

## Driving it with todo-verify

Preconditions:

- 새 launch가 exit 0이고 doctor가 `doctor ok`다.
- 아래 두 `add`가 기대 출력이어야 한다.

- **Prepare tasks.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" remove-add-1 -- add 우유 사기`의 표준 출력은 `추가: [ ] 1 우유 사기`다. `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" remove-add-2 -- add 빨래`의 표준 출력은 `추가: [ ] 2 빨래`다. 둘 다 exit 0이다.
- **Remove 2.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" remove-2 -- remove 2`를 실행한다. `exit:`는 `0`, `store-changed:`는 `yes`, 표준 오류는 비어 있고, 표준 출력은 `삭제: [ ] 2 빨래`다. 저장 파일의 `nextId`는 `3`이고 항목은 1번 `우유 사기`뿐이며 `done`은 `false`다.
- **List the remainder.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" remove-list -- list`의 표준 출력은 `[ ] 1 우유 사기`이고, `store-changed:`는 `no`다.
- **Add after delete.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" remove-add-3 -- add 새 일`의 표준 출력은 `추가: [ ] 3 새 일`이다. `exit:`는 `0`, `store-changed:`는 `yes`다. 저장 파일의 `nextId`는 `4`이고 항목 번호는 `1`과 `3`이다.
- **List both remaining ids.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" remove-list-2 -- list`의 표준 출력은 다음 두 줄이고, `store-changed:`는 `no`다.

```text
[ ] 1 우유 사기
[ ] 3 새 일
```

- **Reject a missing id.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" remove-missing -- remove 9`의 `exit:`는 `1`, `store-changed:`는 `no`, 표준 출력은 비어 있고, 표준 오류는 `번호 9인 할 일이 없습니다`다.
- **Reject a missing argument.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" remove-noarg -- remove`의 `exit:`는 `1`, `store-changed:`는 `no`, 표준 출력은 비어 있고, 표준 오류는 `번호는 1 이상의 정수여야 합니다: undefined`다.

## Gotchas

- 삭제한 번호 2는 다시 쓰이지 않는다. 다음 항목이 2번이면 실패다.
- 지운 항목의 한 줄은 삭제 당시의 완료 표시를 유지한다. 이 여정에서 2번은 미완료라 `삭제: [ ] 2 빨래`다.
- 없는 번호를 거절해도 남은 항목의 바이트는 그대로다.
