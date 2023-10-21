import { FastifyInstance } from "fastify";
import { AppRoutes } from "./app/app.routes";
import { TaskRoutes } from "./tasks/task.routes";

export async function Routes(app: FastifyInstance) {
  app.register(AppRoutes);
  app.register(TaskRoutes);
}
