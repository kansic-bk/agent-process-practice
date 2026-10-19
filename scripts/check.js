// `npm run check`: 안내문(README.md)과 코드가 서로 맞는지 확인한다.
//  1. README "기능 지도" 표의 파일이 존재하고, 적힌 함수를 실제로 export 하는가
//  2. src/ 아래 모든 .js 파일이 문법 검사(node --check)를 통과하는가
//  3. tasks/TASK-*.md 마다 목표·수락 기준·검증 명령·금지 사항 절이 있는가
// 하나라도 틀리면 exit 1.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const problems = [];

function readFeatureMap(readme) {
  const lines = readme.split("\n");
  const start = lines.findIndex((line) => line.trim() === "## 기능 지도");
  if (start === -1) {
    problems.push("README.md에 '## 기능 지도' 절이 없습니다");
    return [];
  }
  const rows = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 4 || cells[0] === "기능" || /^-+$/.test(cells[0])) continue;
    rows.push({ feature: cells[0], file: cells[1].replace(/`/g, ""), fn: cells[2].replace(/`/g, "") });
  }
  if (rows.length === 0) problems.push("기능 지도 표에 행이 없습니다");
  return rows;
}

async function checkFeatureMap() {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  for (const row of readFeatureMap(readme)) {
    const abs = join(root, row.file);
    if (!existsSync(abs)) {
      problems.push(`[${row.feature}] 파일 없음: ${row.file}`);
      continue;
    }
    try {
      const mod = await import(pathToFileURL(abs).href);
      if (typeof mod[row.fn] !== "function") {
        problems.push(`[${row.feature}] ${row.file}가 함수 ${row.fn}을 export 하지 않습니다`);
      }
    } catch (error) {
      problems.push(`[${row.feature}] ${row.file} 불러오기 실패: ${error.message}`);
    }
  }
}

function checkSyntax() {
  const dir = join(root, "src");
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".js"))) {
    const result = spawnSync(process.execPath, ["--check", join(dir, name)], { encoding: "utf8" });
    if (result.status !== 0) problems.push(`문법 오류: src/${name}\n${result.stderr.trim()}`);
  }
}

function checkTaskFiles() {
  const dir = join(root, "tasks");
  const required = ["## 목표", "## 수락 기준", "## 검증 명령", "## 금지 사항"];
  const files = readdirSync(dir).filter((n) => /^TASK-\d{2}\.md$/.test(n));
  if (files.length === 0) problems.push("tasks/ 폴더에 TASK-NN.md 파일이 없습니다");
  for (const name of files) {
    const text = readFileSync(join(dir, name), "utf8");
    for (const heading of required) {
      if (!text.includes(`${heading}\n`)) problems.push(`tasks/${name}에 '${heading}' 절이 없습니다`);
    }
  }
}

await checkFeatureMap();
checkSyntax();
checkTaskFiles();

if (problems.length > 0) {
  console.error("check 실패:");
  for (const p of problems) console.error(` - ${p}`);
  process.exit(1);
}
console.log("check 통과: 기능 지도·문법·과제 파일 모두 정상");
