import { FastifyInstance } from "fastify";
import { prisma } from "../database";

export async function ListPrompts(app: FastifyInstance) {
  app.get("/", async (req, res) => {
    const prompts = await prisma.prompt.findMany();

    return res.send(prompts);
  });
}
