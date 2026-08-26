import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const typeSpecDirectory = resolve(scriptDirectory, "..");
const outputDirectory = resolve(typeSpecDirectory, "tsp-output");
const repositoryDirectory = resolve(typeSpecDirectory, "..");
const compiler = resolve(
  repositoryDirectory,
  "node_modules/@typespec/compiler/cmd/tsp.js",
);

await rm(outputDirectory, { force: true, recursive: true });

const result = spawnSync(
  process.execPath,
  [compiler, "compile", typeSpecDirectory],
  {
    cwd: typeSpecDirectory,
    stdio: "inherit",
  },
);

if (result.status !== 0) process.exit(result.status ?? 1);
