import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
await mkdir(join(root, "../dist/db"), { recursive: true });
await copyFile(join(root, "../src/db/schema.sql"), join(root, "../dist/db/schema.sql"));
