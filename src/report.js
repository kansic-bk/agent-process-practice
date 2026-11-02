import { formatTask } from "./todo.js";

export function formatReport(tasks) {
  const byDay = new Map();
  const undated = [];
  for (const task of tasks) {
    if (task.done !== true) continue;
    if (typeof task.doneOn === "string" && task.doneOn !== "") {
      let bucket = byDay.get(task.doneOn);
      if (!bucket) {
        bucket = [];
        byDay.set(task.doneOn, bucket);
      }
      bucket.push(task);
    } else {
      undated.push(task);
    }
  }
  const lines = [];
  for (const day of [...byDay.keys()].sort()) {
    const bucket = byDay.get(day).slice().sort((a, b) => a.id - b.id);
    lines.push(`${day} (${bucket.length}개)`);
    for (const task of bucket) lines.push(`  ${formatTask(task)}`);
  }
  if (undated.length > 0) {
    const bucket = undated.slice().sort((a, b) => a.id - b.id);
    lines.push(`날짜 없음 (${bucket.length}개)`);
    for (const task of bucket) lines.push(`  ${formatTask(task)}`);
  }
  if (lines.length === 0) return ["(완료한 할 일 없음)"];
  return lines;
}
