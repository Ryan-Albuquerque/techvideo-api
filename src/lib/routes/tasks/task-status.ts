import { FastifyInstance } from "fastify";
import { GetTaskById } from "../../resources/tasks";
import { Status } from "../../utils/enums/status.enum";

export async function TaskStatus(app: FastifyInstance) {
  app.get("/:id", async (req, res) => {
    const { id } = req.params as any;

    console.info(`[${TaskStatus.name}] - Starting listing task status: ${id}`);

    if (!id) {
      return res.status(400).send({ error: "taskId is not provided" });
    }

    const task = await GetTaskById(app, id);

    if (!task) {
      return res.status(404).send({ error: "Task not found" });
    }

    console.info(`[${TaskStatus.name}] - Task Status: ${Status[task.status]}`);

    return res.send({ task });
  });
}
