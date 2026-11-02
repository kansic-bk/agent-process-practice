# 완료 처리

완료 처리는 번호로 항목을 찾아 완료로 표시하고, 번호가 없거나 잘못되면 저장 파일을 그대로 둔 채 거절한다.

## Sub-features

- `done-mark`는 1번 항목을 완료로 표시한다.
- `done-show`는 완료와 미완료를 목록에서 구분한다.
- `done-reject`는 숫자가 아닌 값, 0, 분수가 있는 값, 없는 번호, 빠뜨린 번호를 거절한다.
- `done-again`은 이미 완료된 항목을 다시 완료로 표시해도 내용을 바꾸지 않는다.

## How to get to it (user POV)

- 터미널에서 `node src/cli.js --file <임시 파일> done <번호>`를 실행한다.
- `npm start -- --file <임시 파일> done <번호>`로도 도달한다. 검수 출력 비교는 첫 경로만 쓴다.

## Driving it with todo-verify

Preconditions:

- 새 launch가 exit 0이고 doctor가 `doctor ok`다.
- 아래 두 `add`가 기대 출력이어야 한다. 아니면 이후 `done`을 통과로 적지 않는다.

- **Prepare tasks.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" done-add-1 -- add 우유 사기`의 표준 출력은 `추가: [ ] 1 우유 사기`다. `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" done-add-2 -- add 빨래`의 표준 출력은 `추가: [ ] 2 빨래`다. 둘 다 exit 0이다.
- **Mark 1 done.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" done-ok -- done 1`을 실행한다. `exit:`는 `0`, `store-changed:`는 `yes`, 표준 오류는 비어 있고, 표준 출력은 `완료: [x] 1 우유 사기`다. 저장 파일에서 1번의 `done`은 `true`, 2번의 `done`은 `false`, `nextId`는 `3`이다.
- **Show the mark.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" done-list -- list`를 실행한다. `exit:`는 `0`, `store-changed:`는 `no`다. 표준 출력은 다음 두 줄이다.

```text
[x] 1 우유 사기
[ ] 2 빨래
```

- **Reject bad ids.** 아래 네 명령은 각각 `exit:` `1`, `store-changed:` `no`, 빈 표준 출력이다. 저장 JSON은 `done-ok` 때와 같다.
  - `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" done-abc -- done abc`의 표준 오류는 `번호는 1 이상의 정수여야 합니다: abc`다.
  - `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" done-zero -- done 0`의 표준 오류는 `번호는 1 이상의 정수여야 합니다: 0`이다.
  - `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" done-fraction -- done 1.5`의 표준 오류는 `번호는 1 이상의 정수여야 합니다: 1.5`다.
  - `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" done-missing -- done 9`의 표준 오류는 `번호 9인 할 일이 없습니다`다.
- **Reject a missing id.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" done-noarg -- done`을 실행한다. `exit:`는 `1`, `store-changed:`는 `no`, 표준 출력은 비어 있고, 표준 오류는 `번호는 1 이상의 정수여야 합니다: undefined`다.
- **Mark the same task again.** `.cursor/skills/verify-todo-cli/scripts/drive.sh "$RUN_ID" done-again -- done 1`을 실행한다. `exit:`는 `0`, `store-changed:`는 `no`, 표준 출력은 `완료: [x] 1 우유 사기`다. 1번은 계속 완료다.

## Gotchas

- `done 01`은 번호 1로 처리된다. 검수에서는 앞자리 0을 붙이지 않는다.
- 번호가 없으면 표준 오류의 값 자리가 `undefined`다. 사용법 문장이 아니다.
- 없는 번호는 파일이 없었으면 파일을 만들지 않는다. 이 여정에서는 이미 파일이 있으므로, 바이트가 그대로인지만 본다.
- 완료 출력에는 날짜를 붙이지 않는다. `done --date`는 현재 이 CLI에 없다.
