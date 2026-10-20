// 할 일 목록의 핵심 로직. 파일 입출력은 하지 않고 순수한 자료 구조만 다룬다.

function notFound(id) {
  return new Error(`번호 ${id}인 할 일이 없습니다`);
}

/** 빈 저장소를 만든다. { nextId, tasks } 형태의 평범한 객체다. */
export function createStore() {
  return { nextId: 1, tasks: [] };
}

/**
 * 할 일을 하나 추가하고 추가된 항목을 돌려준다.
 * text가 비어 있거나 문자열이 아니면 Error를 던진다.
 */
export function addTask(store, text) {
  if (typeof text !== "string" || text.trim() === "") {
    throw new Error("할 일 내용이 비어 있습니다");
  }
  const task = { id: store.nextId, text: text.trim(), done: false };
  store.tasks.push(task);
  store.nextId += 1;
  return task;
}

/** 모든 할 일을 id 오름차순 배열로 돌려준다(원본과 분리된 복사본). */
export function listTasks(store) {
  return store.tasks.map((task) => ({ ...task })).sort((a, b) => a.id - b.id);
}

/** id에 해당하는 할 일을 찾는다. 없으면 undefined. */
export function findTask(store, id) {
  return store.tasks.find((task) => task.id === id);
}

/** id의 할 일을 완료 처리하고 돌려준다. 없으면 Error를 던진다. */
export function completeTask(store, id) {
  const task = findTask(store, id);
  if (!task) throw notFound(id);
  task.done = true;
  return task;
}

/** id의 할 일을 삭제하고 삭제된 항목을 돌려준다. 없으면 Error를 던진다. */
export function removeTask(store, id) {
  const index = store.tasks.findIndex((task) => task.id === id);
  if (index === -1) throw notFound(id);
  const [removed] = store.tasks.splice(index, 1);
  return removed;
}

/**
 * 완료(done: true)된 항목을 모두 지우고 지운 개수를 돌려준다.
 * nextId는 바꾸지 않아 번호가 재사용되지 않는다.
 */
export function clearCompleted(store) {
  const remaining = store.tasks.filter((task) => !task.done);
  const removed = store.tasks.length - remaining.length;
  store.tasks = remaining;
  return removed;
}

/** 한 줄 표시 형식. 예: "[x] 3 우유 사기" */
export function formatTask(task) {
  return `[${task.done ? "x" : " "}] ${task.id} ${task.text}`;
}
