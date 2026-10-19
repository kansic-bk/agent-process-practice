// 과제 2(tasks/TASK-02.md)의 검증 테스트. 구현 전에는 실패하고, 구현 후 `npm run test:task02`가 exit 0이어야 한다.
// 이 파일은 수정하지 않는다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createStore, addTask, completeTask, listTasks, clearCompleted } from "../../src/todo.js";

test("clearCompleted는 완료된 항목만 지우고 지운 개수를 돌려준다", () => {
  const store = createStore();
  addTask(store, "a");
  addTask(store, "b");
  addTask(store, "c");
  completeTask(store, 1);
  completeTask(store, 3);
  assert.equal(clearCompleted(store), 2);
  assert.deepEqual(listTasks(store).map((t) => t.id), [2]);
  assert.equal(clearCompleted(store), 0);
  assert.equal(addTask(store, "d").id, 4);
});

test("CLI clear-done 명령", () => {
  const cliPath = fileURLToPath(new URL("../../src/cli.js", import.meta.url));
  const file = join(mkdtempSync(join(tmpdir(), "todo-task02-")), "todo.json");
  const cli = (...args) =>
    spawnSync(process.execPath, [cliPath, "--file", file, ...args], { encoding: "utf8" });
  cli("add", "a");
  cli("add", "b");
  cli("done", "2");
  const r = cli("clear-done");
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), "완료 항목 1개 삭제");
  assert.equal(cli("list").stdout.trim(), "[ ] 1 a");
});
