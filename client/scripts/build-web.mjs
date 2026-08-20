import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, "..");
const viteBin = path.resolve(clientRoot, "node_modules", "vite", "bin", "vite.js");
const env = { ...process.env };

if (!env.VITE_API_BASE_URL) {
  env.VITE_API_BASE_URL = "http://127.0.0.1:4010";
}

const result = spawnSync(process.execPath, [viteBin, "build"], {
  cwd: clientRoot,
  env,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
