// 과제 3(tasks/TASK-03.md)의 검증 테스트. 이 테스트가 정답이며, 고칠 곳은 src/stats.js다.
// 이 파일은 수정하지 않는다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { summarize } from "../../src/stats.js";

test("빈 목록", () => {
  assert.deepEqual(summarize([]), { total: 0, done: 0, open: 0 });
});

test("완료 1개, 미완료 2개", () => {
  const tasks = [
    { id: 1, text: "a", done: true },
    { id: 2, text: "b", done: false },
    { id: 3, text: "c", done: false },
  ];
  assert.deepEqual(summarize(tasks), { total: 3, done: 1, open: 2 });
});

test("전부 완료", () => {
  const tasks = [
    { id: 1, text: "a", done: true },
    { id: 2, text: "b", done: true },
  ];
  assert.deepEqual(summarize(tasks), { total: 2, done: 2, open: 0 });
});
