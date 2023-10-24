import { FastifyInstance } from "fastify";
import { GetTaskById } from "../../resources/tasks";

export async function TaskStatus(app: FastifyInstance) {
  app.get("/:id", async (req, res) => {
    const { id } = req.params as any;

    if (!id) {
      return res.status(400).send({ error: "taskId is not provided" });
    }

    const task = await GetTaskById(app, id);
    return res.send({ task });
  });
}
