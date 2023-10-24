import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import path from "node:path";
import { prisma } from "../../database/index";
import { uploadFile } from "../../resources/cloudflare";
import { UpdateTaskById } from "../../resources/tasks";

export async function UploadVideo(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_848_576 * 150,
    },
  });

  app.post("/", async (req, res) => {
    console.info(`[SERVICE] - Starting ${UploadVideo.name}`);
    const taskId = (res as any).locals.taskId;
    let response, error;
    try {
      console.info(`[${UploadVideo.name}] - Starting validations`);

      const data = await req.file();

      if (!data) {
        return res.status(400).send({ error: "not send videos" });
      }

      const extension = path.extname(data.filename);

      if (extension !== ".mp3") {
        return res.status(400).send({ error: "invalid format" });
      }

      console.info(`[${UploadVideo.name}] - Returning taskId: ${taskId}`);

      res.send({ taskId });

      const { fileUploadName, uploadDir } = await uploadFile(data);

      console.info(`[${UploadVideo.name}] - File uploaded: ${uploadDir}`);

      response = await prisma.video.create({
        data: {
          name: data.filename,
          path: uploadDir,
          uploadName: fileUploadName,
        },
      });
    } catch (e) {
      error = e;
    } finally {
      await UpdateTaskById(app, taskId, response, error as object);
      console.info(
        `[${UploadVideo.name}] - Updating task result: ${JSON.stringify(
          response
        )} - error: ${JSON.stringify(error)}`
      );

      return;
    }
  });
}
