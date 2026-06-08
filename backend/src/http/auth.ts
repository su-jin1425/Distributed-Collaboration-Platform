import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { loginUser, registerUser, verifyToken } from "../services/authService.js";

const authBody = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/auth/register", async (request, reply) => {
    const body = authBody.extend({ name: z.string().min(2) }).parse(request.body);
    const result = await registerUser(body);
    return reply.code(201).send(result);
  });

  app.post("/auth/login", async (request) => {
    const body = authBody.parse(request.body);
    return loginUser(body);
  });

  app.get("/auth/me", async (request, reply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return reply.code(401).send({ message: "missing_authorization" });
    }
    const user = await verifyToken(header.slice("Bearer ".length));
    return { user };
  });
}
