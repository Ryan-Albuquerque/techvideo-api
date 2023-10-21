import { FastifyInstance } from "fastify";
import { TaskStatus } from "./task-status";

export async function TaskRoutes(app: FastifyInstance) {
  app.register(TaskStatus, { prefix: "/task-status" });
}
