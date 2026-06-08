import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

export async function migrate(): Promise<void> {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const schema = await readFile(join(currentDir, "schema.sql"), "utf8");
  await pool.query(schema);
}
