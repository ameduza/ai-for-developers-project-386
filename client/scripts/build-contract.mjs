import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, "..");
const typespecRoot = path.resolve(clientRoot, "..", "typespec");

execSync("npm exec -- tsp compile .", {
  cwd: typespecRoot,
  stdio: "inherit",
});
