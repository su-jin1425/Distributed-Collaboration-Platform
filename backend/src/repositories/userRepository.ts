import { pool } from "../db/pool.js";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, password_hash AS "passwordHash"`,
    [input.name, input.email.toLowerCase(), input.passwordHash]
  );

  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await pool.query(
    `SELECT id, name, email, password_hash AS "passwordHash"
     FROM users
     WHERE email = $1`,
    [email.toLowerCase()]
  );

  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<Omit<UserRecord, "passwordHash"> | null> {
  const result = await pool.query(
    `SELECT id, name, email
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}
