# 과제 1 — 문서: removeTask 사용법 절을 README에 추가

종류: 문서 과제 (코드 변경 없음)
브랜치 이름: `task/01-readme-removetask`

## 목표
`src/todo.js`의 `removeTask(store, id)` 함수를 처음 보는 사람이 README만 읽고 쓸 수 있도록, README.md에 `## removeTask 사용법` 절을 추가한다.

## 수락 기준
1. README.md에 `## removeTask 사용법`이라는 제목의 절이 "기능 지도" 절보다 뒤에 있다.
2. 그 절에 다음 세 가지가 모두 들어 있다.
   - 함수 서명과 인자 설명(`store`, `id`)
   - 실제로 동작하는 코드 예시 한 개(`createStore` → `addTask` → `removeTask` 순서)와 그 예시가 돌려주는 값
   - 없는 번호를 넘겼을 때의 동작(Error를 던진다는 점과 메시지 예)
3. 예시 코드는 `node --input-type=module -e "..."`로 실제 실행했을 때 적은 그대로 출력된다.
4. `npm test`와 `npm run check`가 계속 exit 0이다.

## 검증 명령
```
grep -n "^## removeTask 사용법" README.md
npm test
npm run check
```
첫 명령이 한 줄을 출력하고(exit 0), 나머지 두 명령이 exit 0이면 통과다.

## 금지 사항
- `src/`, `test/`, `scripts/`, `tasks/` 아래 파일은 수정하지 않는다.
- README의 기존 절을 지우거나 순서를 바꾸지 않는다.
- 새 파일을 만들지 않는다.
