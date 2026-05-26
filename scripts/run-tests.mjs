import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

async function collectTestFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTestFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const testsDir = join(repoRoot, "tests");
const testFiles = await collectTestFiles(testsDir);

if (testFiles.length === 0) {
  console.error("No test files found.");
  process.exit(1);
}

const child = spawn(
  process.execPath,
  ["--experimental-strip-types", "--test", ...testFiles],
  {
    cwd: repoRoot,
    stdio: "inherit"
  }
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
