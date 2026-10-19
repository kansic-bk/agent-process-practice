// 할 일 목록의 집계. 과제 3(tasks/TASK-03.md)의 대상 파일이다.

/**
 * 전체·완료·미완료 개수를 돌려준다.
 * 예: 3개 중 1개 완료 → { total: 3, done: 1, open: 2 }
 */
export function summarize(tasks) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  const open = tasks.filter((task) => task.done).length;
  return { total, done, open };
}
