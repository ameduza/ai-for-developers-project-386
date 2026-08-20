import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generate } from "openapi-typescript-codegen";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(clientRoot, "..");
const typespecRoot = path.resolve(repoRoot, "typespec");
const outputDir = path.resolve(clientRoot, "src", "lib", "api", "generated");
const specPath = path.resolve(typespecRoot, "tsp-output", "schema", "openapi.yaml");

rmSync(outputDir, { recursive: true, force: true });

await generate({
  input: specPath,
  output: outputDir,
  client: "fetch",
  useOptions: true,
  useUnionTypes: true,
  useSingleRequestParameter: true,
});
