import { Status } from "../utils/enums/status.enum";

export type Task = {
  taskId: String;
  data?: object;
  status: Status;
  errors?: object;
  createdAt: Date;
};
