// 저장소를 JSON 파일로 읽고 쓴다.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createStore } from "./todo.js";

/** 파일이 없으면 빈 저장소를 돌려준다. 내용이 깨져 있으면 Error를 던진다. */
export function loadStore(filePath) {
  let raw;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return createStore();
    throw error;
  }
  const parsed = JSON.parse(raw);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof parsed.nextId !== "number" ||
    !Array.isArray(parsed.tasks)
  ) {
    throw new Error(`저장 파일 형식이 올바르지 않습니다: ${filePath}`);
  }
  return parsed;
}

/** 저장소를 파일에 쓴다. 상위 폴더가 없으면 만든다. */
export function saveStore(filePath, store) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(store, null, 2) + "\n", "utf8");
}
