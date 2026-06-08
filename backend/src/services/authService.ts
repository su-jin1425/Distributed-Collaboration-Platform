import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { createUser, findUserByEmail, findUserById } from "../repositories/userRepository.js";
import type { AuthenticatedUser } from "../types.js";

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: AuthenticatedUser; token: string }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new Error("EMAIL_ALREADY_REGISTERED");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await createUser({ name: input.name, email: input.email, passwordHash });
  const safeUser = { id: user.id, email: user.email, name: user.name };
  return { user: safeUser, token: signToken(safeUser) };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: AuthenticatedUser; token: string }> {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const safeUser = { id: user.id, email: user.email, name: user.name };
  return { user: safeUser, token: signToken(safeUser) };
}

export async function verifyToken(token: string): Promise<AuthenticatedUser> {
  const payload = jwt.verify(token, config.JWT_SECRET) as { sub: string };
  const user = await findUserById(payload.sub);
  if (!user) {
    throw new Error("INVALID_TOKEN");
  }

  return user;
}

function signToken(user: AuthenticatedUser): string {
  return jwt.sign({ email: user.email, name: user.name }, config.JWT_SECRET, {
    subject: user.id,
    expiresIn: "2h"
  });
}
