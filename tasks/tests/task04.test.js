// 과제 4(tasks/TASK-04.md)의 검증 테스트. 구현 전에는 실패하고, 구현 후 `npm run test:task04`가 exit 0이어야 한다.
// 이 파일은 수정하지 않는다.
// 결과가 실행 시각·시간대에 따라 바뀌지 않도록, 날짜는 고정값으로 주거나 시간대를 고정한 자식 프로세스에서 확인한다.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatReport } from "../../src/report.js";

const cliPath = fileURLToPath(new URL("../../src/cli.js", import.meta.url));

// 서로 다른 시간대. 날짜 문자열을 Date로 바꿨다가 되돌리는 구현은 이 중 어딘가에서 하루가 밀린다.
const ZONES = ["UTC", "Asia/Seoul", "America/Los_Angeles", "Pacific/Kiritimati", "Pacific/Pago_Pago"];

function freshFile() {
  return join(mkdtempSync(join(tmpdir(), "todo-task04-")), "todo.json");
}

function cli(file, zone, ...args) {
  const r = spawnSync(process.execPath, [cliPath, "--file", file, ...args], {
    encoding: "utf8",
    env: { ...process.env, TZ: zone },
  });
  return { code: r.status, out: r.stdout.trim(), err: r.stderr.trim() };
}

// timeZone 기준 오늘 날짜(YYYY-MM-DD). 테스트 프로세스의 시간대와 무관하다.
function todayIn(timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

test("formatReport는 완료 항목만 날짜 오름차순으로 묶고, 날짜 없는 완료 항목은 맨 뒤 '날짜 없음'에 둔다", () => {
  const tasks = [
    { id: 5, text: "옛 항목", done: true },
    { id: 4, text: "청소", done: true, doneOn: "2026-10-22" },
    { id: 3, text: "빨래", done: true, doneOn: "2026-10-20" },
    { id: 2, text: "아직", done: false },
    { id: 6, text: "되돌린 항목", done: false, doneOn: "2026-10-19" },
    { id: 1, text: "우유 사기", done: true, doneOn: "2026-10-20" },
  ];
  assert.deepEqual(formatReport(tasks), [
    "2026-10-20 (2개)",
    "  [x] 1 우유 사기",
    "  [x] 3 빨래",
    "2026-10-22 (1개)",
    "  [x] 4 청소",
    "날짜 없음 (1개)",
    "  [x] 5 옛 항목",
  ]);
  assert.deepEqual(formatReport([]), ["(완료한 할 일 없음)"]);
  assert.deepEqual(formatReport([{ id: 1, text: "a", done: false }]), ["(완료한 할 일 없음)"]);
});

test("formatReport는 번호를 수로 정렬하고, 날짜 없음 개수를 세며, 입력 배열과 항목을 바꾸지 않는다", () => {
  const tasks = [
    { id: 10, text: "열", done: true, doneOn: "2026-10-20" },
    { id: 2, text: "둘", done: true, doneOn: "2026-10-20" },
    { id: 9, text: "아홉", done: true, doneOn: "2026-10-20" },
    { id: 12, text: "예전 둘", done: true },
    { id: 11, text: "예전 하나", done: true },
  ];
  const before = JSON.parse(JSON.stringify(tasks));
  const items = [...tasks];
  assert.deepEqual(formatReport(tasks), [
    "2026-10-20 (3개)",
    "  [x] 2 둘",
    "  [x] 9 아홉",
    "  [x] 10 열",
    "날짜 없음 (2개)",
    "  [x] 11 예전 하나",
    "  [x] 12 예전 둘",
  ]);
  assert.deepEqual(tasks, before);
  assert.equal(tasks.length, items.length);
  tasks.forEach((task, i) => assert.equal(task, items[i]));
});

test("CLI done --date와 report — 어느 시간대에서 실행해도 같은 결과", () => {
  for (const zone of ZONES) {
    const file = freshFile();
    cli(file, zone, "add", "우유", "사기");
    cli(file, zone, "add", "빨래");
    cli(file, zone, "add", "청소");
    cli(file, zone, "add", "아직");

    let r = cli(file, zone, "done", "3", "--date", "2026-10-22");
    assert.equal(r.code, 0, zone);
    assert.equal(r.out, "완료: [x] 3 청소", zone);
    cli(file, zone, "done", "2", "--date", "2026-10-20");
    cli(file, zone, "done", "1", "--date", "2026-10-20");

    const saved = JSON.parse(readFileSync(file, "utf8"));
    assert.deepEqual(
      saved.tasks.map((t) => [t.id, t.done, t.doneOn]),
      [
        [1, true, "2026-10-20"],
        [2, true, "2026-10-20"],
        [3, true, "2026-10-22"],
        [4, false, undefined],
      ],
      zone,
    );
    assert.equal(
      cli(file, zone, "list").out,
      "[x] 1 우유 사기\n[x] 2 빨래\n[x] 3 청소\n[ ] 4 아직",
      zone,
    );

    r = cli(file, zone, "report");
    assert.equal(r.code, 0, zone);
    assert.equal(
      r.out,
      "2026-10-20 (2개)\n  [x] 1 우유 사기\n  [x] 2 빨래\n2026-10-22 (1개)\n  [x] 3 청소",
      zone,
    );

    // 이미 완료한 항목을 다시 done 하면 날짜를 새 값으로 바꾼다(잘못 적은 날짜 고치기).
    r = cli(file, zone, "done", "3", "--date", "2026-02-28");
    assert.equal(r.code, 0, zone);
    assert.equal(
      cli(file, zone, "report").out,
      "2026-02-28 (1개)\n  [x] 3 청소\n2026-10-20 (2개)\n  [x] 1 우유 사기\n  [x] 2 빨래",
      zone,
    );
  }
});

test("--date를 생략하면 실행한 컴퓨터의 현지 시간대(TZ) 기준 오늘 날짜를 기록한다", () => {
  for (const zone of ["Pacific/Kiritimati", "Pacific/Pago_Pago", "UTC"]) {
    const file = freshFile();
    cli(file, zone, "add", "오늘 할 일");
    const before = todayIn(zone);
    const r = cli(file, zone, "done", "1");
    const after = todayIn(zone);
    assert.equal(r.code, 0, zone);
    assert.equal(r.out, "완료: [x] 1 오늘 할 일", zone);
    const doneOn = JSON.parse(readFileSync(file, "utf8")).tasks[0].doneOn;
    assert.ok(doneOn === before || doneOn === after, `${zone}: ${doneOn} (기대 ${before} 또는 ${after})`);
    assert.equal(cli(file, zone, "report").out, `${doneOn} (1개)\n  [x] 1 오늘 할 일`, zone);

    // 이미 완료한 항목을 --date 없이 다시 done 해도 오늘 날짜로 바뀐다.
    cli(file, zone, "done", "1", "--date", "2020-01-01");
    const before2 = todayIn(zone);
    const r2 = cli(file, zone, "done", "1");
    const after2 = todayIn(zone);
    assert.equal(r2.code, 0, zone);
    const redone = JSON.parse(readFileSync(file, "utf8")).tasks[0].doneOn;
    assert.ok(redone === before2 || redone === after2, `${zone}: ${redone} (기대 ${before2} 또는 ${after2})`);
  }
});

test("예전 저장 파일(완료 날짜 없는 완료 항목)도 report가 읽고, report는 파일을 바꾸지 않는다", () => {
  const file = freshFile();
  const old = {
    nextId: 4,
    tasks: [
      { id: 1, text: "예전에 끝낸 일", done: true },
      { id: 2, text: "남은 일", done: false },
      { id: 3, text: "새로 끝낸 일", done: true, doneOn: "2026-10-21" },
    ],
  };
  const raw = JSON.stringify(old, null, 2) + "\n";
  writeFileSync(file, raw, "utf8");
  const r = cli(file, "UTC", "report");
  assert.equal(r.code, 0);
  assert.equal(r.out, "2026-10-21 (1개)\n  [x] 3 새로 끝낸 일\n날짜 없음 (1개)\n  [x] 1 예전에 끝낸 일");
  assert.equal(readFileSync(file, "utf8"), raw);

  const empty = freshFile();
  const e = cli(empty, "UTC", "report");
  assert.equal(e.code, 0);
  assert.equal(e.out, "(완료한 할 일 없음)");
  assert.equal(existsSync(empty), false);
});

test("잘못된 --date는 exit 1, 형식을 알려 주고, 항목과 파일을 바꾸지 않는다", () => {
  const file = freshFile();
  cli(file, "UTC", "add", "a");
  const raw = readFileSync(file, "utf8");
  const bad = [
    ["--date", "2026-02-29"],
    ["--date", "2026-13-01"],
    ["--date", "2026-10-32"],
    ["--date", "2026-1-5"],
    ["--date", "20261020"],
    ["--date", "2026-10-20T09:00"],
    ["--date", "12026-10-20"],
    ["--date", "x2026-10-20"],
    ["--date", "1900-02-29"],
    ["--date"],
  ];
  for (const extra of bad) {
    const r = cli(file, "UTC", "done", "1", ...extra);
    assert.equal(r.code, 1, extra.join(" "));
    assert.match(r.err, /YYYY-MM-DD/, extra.join(" "));
    assert.equal(readFileSync(file, "utf8"), raw, extra.join(" "));
  }
  for (const good of ["2028-02-29", "2000-02-29"]) {
    const ok = cli(file, "UTC", "done", "1", "--date", good);
    assert.equal(ok.code, 0, good);
    assert.equal(cli(file, "UTC", "report").out, `${good} (1개)\n  [x] 1 a`, good);
  }
});

test("잘못된 명령의 사용법 안내에 report와 --date가 보인다", () => {
  const r = cli(freshFile(), "UTC", "fly");
  assert.equal(r.code, 1);
  assert.match(r.err, /report/);
  assert.match(r.err, /--date/);
});
