import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().default("postgresql://postgres:password@localhost:5432/collaboration_db"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(24).default("development-secret-change-before-release"),
  PORT: z.coerce.number().int().positive().default(8000),
  WS_PORT: z.coerce.number().int().positive().default(8001),
  CORS_ORIGIN: z.string().default("http://localhost:3000")
});

export const config = envSchema.parse(process.env);
