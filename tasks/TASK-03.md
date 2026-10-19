# 과제 3 — 수리: 실패하는 테스트를 통과시키기

종류: 버그 수정 (테스트가 정답, 코드가 틀림)
브랜치 이름: `task/03-fix-summarize`

## 목표
`npm run test:task03`가 지금 실패한다. 실패 원인은 `src/stats.js`의 `summarize(tasks)` 함수에 있다. 테스트 `tasks/tests/task03.test.js`가 기대하는 값이 정답이다. 코드를 고쳐 테스트를 통과시킨다.

## 수락 기준
1. `npm run test:task03`가 exit 0이다.
2. `npm test`와 `npm run check`가 계속 exit 0이다.
3. 고친 것은 `src/stats.js` 한 파일뿐이다(`git diff --name-only main`으로 확인).
4. 완료 보고의 "결과" 칸에 원인을 한 문장으로 적는다(어느 줄이 왜 틀렸는지).

## 검증 명령
```
npm run test:task03
npm test
npm run check
git diff --name-only main
```
앞의 세 명령이 exit 0이고 마지막 명령이 `src/stats.js` 한 줄만 출력하면 통과다.

## 금지 사항
- `tasks/tests/task03.test.js`는 수정·삭제하지 않는다.
- 테스트를 건너뛰거나(`skip`, `todo`) package.json의 `test:task03` 스크립트를 바꾸지 않는다.
- `src/stats.js` 외의 파일은 건드리지 않는다.
