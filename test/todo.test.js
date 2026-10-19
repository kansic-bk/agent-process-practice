import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createStore,
  addTask,
  listTasks,
  findTask,
  completeTask,
  removeTask,
  formatTask,
} from "../src/todo.js";

test("addTask는 번호를 1부터 차례로 붙인다", () => {
  const store = createStore();
  const a = addTask(store, "첫째");
  const b = addTask(store, "둘째");
  assert.equal(a.id, 1);
  assert.equal(b.id, 2);
  assert.equal(a.done, false);
});

test("addTask는 앞뒤 공백을 지우고 빈 내용은 거부한다", () => {
  const store = createStore();
  assert.equal(addTask(store, "  우유 사기 ").text, "우유 사기");
  assert.throws(() => addTask(store, "   "), /비어/);
  assert.throws(() => addTask(store, undefined), /비어/);
});

test("listTasks는 id 오름차순 복사본을 돌려준다", () => {
  const store = createStore();
  addTask(store, "a");
  addTask(store, "b");
  const list = listTasks(store);
  list[0].text = "바꿈";
  assert.equal(findTask(store, 1).text, "a");
  assert.deepEqual(list.map((t) => t.id), [1, 2]);
});

test("completeTask는 done을 true로 만들고 없는 번호는 거부한다", () => {
  const store = createStore();
  addTask(store, "a");
  assert.equal(completeTask(store, 1).done, true);
  assert.throws(() => completeTask(store, 9), /없습니다/);
});

test("removeTask는 항목을 지우고 지운 항목을 돌려준다", () => {
  const store = createStore();
  addTask(store, "a");
  addTask(store, "b");
  const removed = removeTask(store, 1);
  assert.equal(removed.text, "a");
  assert.deepEqual(listTasks(store).map((t) => t.id), [2]);
  assert.throws(() => removeTask(store, 1), /없습니다/);
});

test("삭제 뒤 추가해도 번호는 재사용하지 않는다", () => {
  const store = createStore();
  addTask(store, "a");
  removeTask(store, 1);
  assert.equal(addTask(store, "b").id, 2);
});

test("formatTask 표시 형식", () => {
  assert.equal(formatTask({ id: 3, text: "우유", done: false }), "[ ] 3 우유");
  assert.equal(formatTask({ id: 3, text: "우유", done: true }), "[x] 3 우유");
});
