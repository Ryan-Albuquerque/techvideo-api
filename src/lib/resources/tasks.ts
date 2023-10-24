import { FastifyInstance } from "fastify/types/instance";
import { randomUUID } from "node:crypto";
import { Status } from "../utils/enums/status.enum";
import { Task } from "../types/task";

const key = "tasks";

export const CreateTask = async (
  app: FastifyInstance,
  req: any,
  res: any
): Promise<void> => {
  console.info(
    `[MIDDLEWARE] ${new Date()} - Starting '${
      req.originalUrl
    }' Request Body: ${JSON.stringify(req.body)}`
  );
  const { redis } = app;
  const delayTime = 1000 * 60 * 5; //5min
  const date = new Date();

  const taskId = randomUUID();

  res.locals = {
    taskId,
  };

  const task: Task = {
    taskId,
    status: Status.WAITING,
    createdAt: new Date(),
  };

  const taskListString = await redis.get(key);

  const taskList = (taskListString && JSON.parse(taskListString)) ?? [];

  const cleanedTaskList = taskList.filter((task: Task) => {
    const createdAt = new Date(task.createdAt).getTime();

    return (task.status === Status.DONE &&
      date.getTime() > createdAt + delayTime) ||
      date.getTime() > createdAt + delayTime * 3
      ? false
      : true;
  });

  cleanedTaskList.push(task);
  await redis.set(key, JSON.stringify(cleanedTaskList));

  console.info(`[MIDDLEWARE] - Task created successfully - ${task.taskId}`);
  return;
};

export const GetTaskById = async (
  app: FastifyInstance,
  id: string
): Promise<Task | null> => {
  console.info(`[MIDDLEWARE] - Getting task - ${id}`);

  const { redis } = app;

  const taskListString = await redis.get(key);

  const taskList = (taskListString && JSON.parse(taskListString)) ?? [];

  const task = taskList.find((task: Task) => task.taskId === id);

  return task;
};

export const UpdateTaskById = async (
  app: FastifyInstance,
  id: string,
  data?: object,
  errors?: object
): Promise<Task> => {
  console.info(`[MIDDLEWARE] - Updating task - ${id}`);

  const { redis } = app;
  let taskUpdated = {} as Task;

  const taskListString = await redis.get(key);

  const taskList = (taskListString && JSON.parse(taskListString)) ?? [];

  const newTaskList: Task[] = taskList.map((task: Task) => {
    if (task.taskId === id) {
      taskUpdated = {
        ...task,
        status: data ? Status.DONE : Status.ERROR,
        data,
        errors,
      };
      return taskUpdated;
    }
    return task;
  });

  await redis.set(key, JSON.stringify(newTaskList));

  console.info(`[MIDDLEWARE] - Task Updated - ${taskUpdated}`);

  return taskUpdated;
};
