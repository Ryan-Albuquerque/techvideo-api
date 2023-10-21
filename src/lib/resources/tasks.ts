import { FastifyInstance } from "fastify/types/instance";
import { randomUUID } from "node:crypto";

enum Status {
  PENDING,
  FAIL,
  DONE,
}
type taskRedisType = {
  taskId: String;
  fkId: String | null;
  data: object;
  status: Status;
  errors?: object;
};

export const CreateTaskMiddleware = async (
  app: FastifyInstance,
  req,
  res
): Promise<void> => {
  const { redis } = app;
  const taskId = randomUUID();
  const key = "tasks";

  res.locals = {
    taskId,
  };

  const task: taskRedisType = {
    taskId,
    fkId: null,
    data: {},
    status: Status.PENDING,
  };

  const taskListString = await redis.get(key);

  const taskList = (taskListString && JSON.parse(taskListString)) ?? [];

  taskList.push(task);

  await redis.set(key, JSON.stringify(taskList));

  return;
};
