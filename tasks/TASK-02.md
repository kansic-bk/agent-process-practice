# 과제 2 — 코드: 완료 항목 일괄 삭제 기능 추가

종류: 작은 기능 추가 (테스트는 미리 제공됨)
브랜치 이름: `task/02-clear-done`

## 목표
완료된 할 일을 한 번에 지우는 기능을 추가한다.
- `src/todo.js`에 `clearCompleted(store)` 함수를 추가해 export 한다. 완료(`done: true`)된 항목을 모두 지우고 지운 개수(정수)를 돌려준다. 번호는 재사용하지 않는다(`nextId`를 건드리지 않는다).
- `src/cli.js`에 `clear-done` 명령을 추가한다. 실행하면 저장 파일을 갱신하고 `완료 항목 N개 삭제` 한 줄을 출력한다.

검증 테스트는 `tasks/tests/task02.test.js`에 이미 있다. 구현 전에는 실패하고(함수가 없으므로 import 단계에서 오류), 구현 후에는 통과해야 한다.

## 수락 기준
1. `npm run test:task02`가 exit 0이다.
2. `npm test`와 `npm run check`가 계속 exit 0이다.
3. README.md의 "기능 지도" 표에 `완료 항목 일괄 삭제 | src/todo.js | clearCompleted | npm run test:task02` 행이 추가돼 있다.
4. README.md의 "명령 사용법" 절에 `clear-done` 명령이 한 줄 추가돼 있다.

## 검증 명령
```
npm run test:task02
npm test
npm run check
```
세 명령 모두 exit 0이면 통과다.

## 금지 사항
- `tasks/tests/task02.test.js`는 수정하지 않는다.
- `test/` 아래 기존 테스트를 수정하거나 지우지 않는다.
- 새 의존성(package.json의 dependencies/devDependencies)을 추가하지 않는다.
- 이 과제와 무관한 파일(`src/stats.js`, 다른 과제 파일)은 건드리지 않는다.
