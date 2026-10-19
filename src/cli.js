#!/usr/bin/env node
// 명령줄 진입점. 사용법은 README.md의 "명령 사용법" 절을 본다.
import { pathToFileURL } from "node:url";
import { loadStore, saveStore } from "./storage.js";
import { addTask, listTasks, completeTask, removeTask, formatTask } from "./todo.js";

const USAGE = `사용법: node src/cli.js [--file <경로>] <명령> [인자]
명령:
  add <내용>     할 일 추가
  list           목록 출력
  done <번호>    완료 처리
  remove <번호>  삭제
--file을 생략하면 현재 폴더의 todo.json을 쓴다.`;

/** 인자 배열을 { filePath, command, rest }로 나눈다. */
export function parseArgs(argv) {
  let filePath = "todo.json";
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--file") {
      if (i + 1 >= argv.length) throw new Error("--file 뒤에 경로가 필요합니다");
      filePath = argv[i + 1];
      i += 1;
    } else {
      positional.push(argv[i]);
    }
  }
  const [command, ...rest] = positional;
  return { filePath, command, rest };
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`번호는 1 이상의 정수여야 합니다: ${value}`);
  }
  return id;
}

/** 명령을 실행하고 출력할 문자열 배열을 돌려준다. 실패는 Error로 던진다. */
export function run(argv) {
  const { filePath, command, rest } = parseArgs(argv);
  const store = loadStore(filePath);
  switch (command) {
    case "add": {
      const task = addTask(store, rest.join(" "));
      saveStore(filePath, store);
      return [`추가: ${formatTask(task)}`];
    }
    case "list": {
      const tasks = listTasks(store);
      return tasks.length === 0 ? ["(할 일 없음)"] : tasks.map(formatTask);
    }
    case "done": {
      const task = completeTask(store, parseId(rest[0]));
      saveStore(filePath, store);
      return [`완료: ${formatTask(task)}`];
    }
    case "remove": {
      const task = removeTask(store, parseId(rest[0]));
      saveStore(filePath, store);
      return [`삭제: ${formatTask(task)}`];
    }
    default:
      throw new Error(USAGE);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    for (const line of run(process.argv.slice(2))) console.log(line);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
