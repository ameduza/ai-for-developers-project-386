import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDir, '..');

process.env.VITE_API_BASE_URL ||= '/api';

await build({ root: clientRoot });
