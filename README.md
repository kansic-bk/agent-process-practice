# agent-process-practice — 에이전트 작업자 연습용 할 일 목록 CLI

이 저장소는 에이전트 작업자가 "저장소를 받아서 → 설치하고 → 테스트하고 → 검사하고 → 과제를 끝내고 → 보고하는" 한 바퀴를 사람의 도움 없이 연습하기 위한 것이다. 내용은 어느 회사·서비스와도 무관한 작은 할 일 목록 명령줄 도구다. 외부 패키지 의존성은 없다.

## 요구 환경

- Node.js 26.10.0 (이 저장소를 만든 맥북의 설치본 기준. `node:test`를 쓰므로 Node 20 이상이면 동작하지만, 확인된 버전은 26.10.0이다)
- npm 11.19.1 (Node와 함께 설치된 것)
- 설치할 패키지가 없어 `npm install`은 아무 파일도 바꾸지 않는다.

## 작업자 안내 — 반드시 이 순서로

지시문을 받은 작업자는 아래 1~6을 순서대로 하고, 각 단계의 명령과 exit code를 완료 보고에 적는다.

1. 받기: `git clone https://github.com/kansic-bk/agent-process-practice.git agent-process-practice && cd agent-process-practice`
2. 설치: `npm install` (exit 0이어야 한다. 설치할 패키지가 없으므로 수 초 안에 끝난다)
3. 테스트: `npm test` (exit 0이어야 한다)
4. 검사: `npm run check` (exit 0이어야 한다. 안내문의 기능 지도와 코드가 맞는지, 과제 파일 형식이 맞는지 본다)
5. 과제: `tasks/` 폴더에서 지시받은 과제 파일 하나를 열어 목표·수락 기준·검증 명령·금지 사항을 읽고, 아래 브랜치 규칙대로 브랜치를 만든 뒤 작업한다.
6. 보고: 과제 파일의 검증 명령을 모두 실행해 exit code를 확인하고, 아래 "완료 보고 5칸" 양식으로 보고한다. 브랜치를 올리고 PR을 만드는 것은 지시문이 허용한 경우에만 한다.

3·4단계가 exit 0이 아니면 과제를 시작하지 말고, 실패 출력을 그대로 붙여 보고한다.

### 브랜치 이름 규칙

`task/<두 자리 과제 번호>-<짧은 영문 설명>` — 예: `task/01-readme-removetask`, `task/02-clear-done`, `task/03-fix-summarize`. 각 과제 파일에 쓸 이름이 적혀 있다. `main`에 직접 커밋하지 않는다. 커밋 메시지 첫 줄은 `TASK-NN: 한 일 한 줄`로 쓴다.

### 완료 보고 5칸

보고는 아래 다섯 칸을 이 순서로, 칸 이름을 그대로 쓴다. 각 칸은 사실만 적고 추측은 "미확인"으로 표시한다.

```
결과: (무엇을 바꿨는지, 브랜치 이름, 커밋 SHA)
실행 명령과 결과: (실행한 명령 각각과 exit code, 실패했으면 출력 그대로)
검수자와 판정: (누가 검수했는지, 통과/미통과. 검수자가 없으면 "없음")
남은 일·미확인: (수락 기준 중 못 한 것, 확인하지 못한 것)
이번 작업 완료와 서비스 전체 완료 구분: (이번 과제가 끝났는지와, 저장소 전체 과제가 다 끝났는지를 따로 적는다)
```

### 공통 금지 사항

- `tasks/tests/` 아래 테스트 파일은 어떤 과제에서도 수정하지 않는다.
- 새 외부 패키지를 추가하지 않는다.
- 지시받은 과제 하나만 한다. 다른 과제의 파일은 건드리지 않는다.
- README와 과제 파일 외에 새 문서를 만들지 않는다.

## 명령 사용법

```
node src/cli.js [--file <경로>] <명령> [인자]

  add <내용>     할 일 추가            예: node src/cli.js add 우유 사기
  list           목록 출력             예: node src/cli.js list
  done <번호>    완료 처리             예: node src/cli.js done 1
  remove <번호>  삭제                  예: node src/cli.js remove 1
  clear-done     완료 항목 일괄 삭제     예: node src/cli.js clear-done
```

`--file`을 생략하면 현재 폴더의 `todo.json`에 저장한다(이 파일은 .gitignore에 있다). 출력 형식은 `[ ] 1 우유 사기`(미완료), `[x] 1 우유 사기`(완료)다. 잘못된 명령·번호·빈 내용은 exit 1과 함께 표준 오류에 이유를 출력한다.

## 기능 지도

기능 → 들어가는 파일과 함수 → 그 기능을 확인하는 명령. `npm run check`가 이 표의 파일·함수가 실제로 존재하는지 대조한다.

| 기능 | 파일 | 함수 | 검증 명령 |
|---|---|---|---|
| 빈 저장소 만들기 | `src/todo.js` | `createStore` | `npm test` |
| 할 일 추가 | `src/todo.js` | `addTask` | `npm test` |
| 목록 조회 | `src/todo.js` | `listTasks` | `npm test` |
| 번호로 찾기 | `src/todo.js` | `findTask` | `npm test` |
| 완료 처리 | `src/todo.js` | `completeTask` | `npm test` |
| 삭제 | `src/todo.js` | `removeTask` | `npm test` |
| 완료 항목 일괄 삭제 | `src/todo.js` | `clearCompleted` | `npm run test:task02` |
| 한 줄 표시 형식 | `src/todo.js` | `formatTask` | `npm test` |
| 저장 파일 읽기 | `src/storage.js` | `loadStore` | `npm test` |
| 저장 파일 쓰기 | `src/storage.js` | `saveStore` | `npm test` |
| 명령줄 인자 해석 | `src/cli.js` | `parseArgs` | `npm test` |
| 명령 실행(진입점) | `src/cli.js` | `run` | `npm test` |
| 개수 집계 | `src/stats.js` | `summarize` | `npm run test:task03` (과제 3 전까지는 설계대로 실패) |

## removeTask 사용법

`removeTask(store, id)`는 `store`에서 번호가 `id`인 할 일을 하나 삭제하고, 삭제된 항목을 돌려준다. 저장소에 그 번호가 없으면 `Error`를 던진다.

- `store`: `createStore()`가 돌려주는 저장소 객체. 형태는 `{ nextId, tasks }`다.
- `id`: 삭제할 할 일의 번호. `addTask`가 그 항목에 붙인 숫자와 같아야 한다.

아래는 `createStore` → `addTask` → `removeTask` 순서의 예시다. 저장소 루트에서 이 명령을 실행한다.

```
node --input-type=module -e 'import { createStore, addTask, removeTask } from "./src/todo.js"; const store = createStore(); addTask(store, "우유 사기"); console.log(JSON.stringify(removeTask(store, 1)));'
```

표준 출력은 다음 한 줄이다. 이것이 `removeTask(store, 1)`이 돌려준 값이다.

```
{"id":1,"text":"우유 사기","done":false}
```

없는 번호를 넘기면 `Error`를 던진다. 빈 저장소에서 `removeTask(store, 1)`을 호출한 예:

```
node --input-type=module -e 'import { createStore, removeTask } from "./src/todo.js"; const store = createStore(); try { removeTask(store, 1); console.log("NO_THROW"); } catch (error) { console.log(error instanceof Error); console.log(error.name); console.log(error.message); }'
```

표준 출력:

```
true
Error
번호 1인 할 일이 없습니다
```

`true`는 던져진 값이 `Error` 인스턴스라는 뜻이고, 메시지는 `번호 1인 할 일이 없습니다`다.

## 검증 명령과 현재 상태

| 명령 | 하는 일 | 처음 받은 상태에서의 결과 |
|---|---|---|
| `npm test` | 핵심 로직과 CLI 테스트 (`test/` 폴더) | exit 0 |
| `npm run check` | 기능 지도·문법·과제 파일 형식 검사 (`scripts/check.js`) | exit 0 |
| `npm run test:task02` | 과제 2의 검증 테스트 | exit 0 (과제 2 완료 — 기능 구현됨) |
| `npm run test:task03` | 과제 3의 검증 테스트 | exit 0 (과제 3 완료 — 버그 수정됨) |
| `npm run test:task04` | 과제 4의 검증 테스트 | exit 1 (구현 전 — 실패가 정상) |

과제 테스트는 일부러 `npm test`에 넣지 않았다. 과제를 끝낸 뒤에도 `npm test`는 항상 exit 0이어야 한다. `node --test`를 인자 없이 실행하면 과제 테스트까지 함께 잡혀 실패로 보이므로, 테스트는 반드시 `npm test`로 돌린다.

## 과제 목록

| 과제 | 종류 | 파일 |
|---|---|---|
| 과제 1 | 문서: `removeTask` 사용법 절을 README에 추가 | `tasks/TASK-01.md` |
| 과제 2 | 코드: 완료 항목 일괄 삭제 기능 추가 (테스트 제공) | `tasks/TASK-02.md` |
| 과제 3 | 수리: 실패하는 테스트를 통과시키기 | `tasks/TASK-03.md` |
| 과제 4 | 코드: 완료한 할 일을 날짜별로 묶어 보여 주는 report 명령 추가 (테스트 제공) | `tasks/TASK-04.md` |

## 저장소 구조

```
src/todo.js            핵심 로직 (순수 함수)
src/storage.js         JSON 파일 읽기·쓰기
src/stats.js           개수 집계 (과제 3 대상)
src/cli.js             명령줄 진입점
test/*.test.js         npm test가 돌리는 테스트
scripts/check.js       npm run check
tasks/TASK-NN.md       과제 파일 (목표·수락 기준·검증 명령·금지 사항)
tasks/tests/*.test.js  과제별 검증 테스트 (수정 금지)
```
