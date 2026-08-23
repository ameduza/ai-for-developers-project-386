import { rmSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import { generate } from "openapi-typescript-codegen";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(clientRoot, "..");
const typespecRoot = path.resolve(repoRoot, "typespec");
const outputDir = path.resolve(clientRoot, "src", "lib", "api", "generated");
const specPath = path.resolve(
  typespecRoot,
  "tsp-output",
  "schema",
  "openapi.yaml",
);

async function* listGeneratedFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* listGeneratedFiles(entryPath);
    } else if (entry.name.endsWith(".ts")) {
      yield entryPath;
    }
  }
}

rmSync(outputDir, { recursive: true, force: true });

await generate({
  input: specPath,
  output: outputDir,
  client: "fetch",
  useOptions: true,
  useUnionTypes: true,
  useSingleRequestParameter: true,
});

for await (const file of listGeneratedFiles(outputDir)) {
  const source = await readFile(file, "utf8");
  const formatted = await format(source, { filepath: file });
  await writeFile(file, formatted);
}
