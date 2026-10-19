import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../src/cli.js", import.meta.url));

function cli(filePath, ...args) {
  const result = spawnSync(process.execPath, [cliPath, "--file", filePath, ...args], {
    encoding: "utf8",
  });
  return { code: result.status, out: result.stdout.trim(), err: result.stderr.trim() };
}

function freshFile() {
  return join(mkdtempSync(join(tmpdir(), "todo-cli-")), "todo.json");
}

test("add → list → done → remove 한 바퀴", () => {
  const file = freshFile();
  assert.equal(cli(file, "list").out, "(할 일 없음)");

  let r = cli(file, "add", "우유", "사기");
  assert.equal(r.code, 0);
  assert.equal(r.out, "추가: [ ] 1 우유 사기");

  cli(file, "add", "빨래");
  assert.equal(cli(file, "list").out, "[ ] 1 우유 사기\n[ ] 2 빨래");

  r = cli(file, "done", "1");
  assert.equal(r.code, 0);
  assert.equal(r.out, "완료: [x] 1 우유 사기");

  r = cli(file, "remove", "2");
  assert.equal(r.code, 0);
  assert.equal(cli(file, "list").out, "[x] 1 우유 사기");

  const saved = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(saved.nextId, 3);
  assert.equal(saved.tasks.length, 1);
});

test("잘못된 명령·번호·빈 내용은 exit 1과 설명 메시지", () => {
  const file = freshFile();
  let r = cli(file, "fly");
  assert.equal(r.code, 1);
  assert.match(r.err, /사용법/);

  r = cli(file, "done", "abc");
  assert.equal(r.code, 1);
  assert.match(r.err, /정수/);

  r = cli(file, "done", "7");
  assert.equal(r.code, 1);
  assert.match(r.err, /없습니다/);

  r = cli(file, "add", "");
  assert.equal(r.code, 1);
  assert.match(r.err, /비어/);
});

test("깨진 저장 파일은 exit 1로 알리고 덮어쓰지 않는다", () => {
  const file = freshFile();
  writeFileSync(file, "{ 깨짐", "utf8");
  const r = cli(file, "add", "x");
  assert.equal(r.code, 1);
  assert.equal(readFileSync(file, "utf8"), "{ 깨짐");
});
