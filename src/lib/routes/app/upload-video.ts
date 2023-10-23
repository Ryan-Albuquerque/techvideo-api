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
    const taskId = res.locals.taskId;
    let response, error;
    try {
      const data = await req.file();

      if (!data) {
        return res.status(400).send({ error: "not send videos" });
      }

      const extension = path.extname(data.filename);

      if (extension !== ".mp3") {
        return res.status(400).send({ error: "invalid format" });
      }

      res.send({ taskId });

      const { fileUploadName, uploadDir } = await uploadFile(data);

      response = await prisma.video.create({
        data: {
          name: data.filename,
          path: uploadDir,
          uploadName: fileUploadName,
        },
      });
    } catch (e) {
      error = JSON.stringify(e);
    } finally {
      const result = await UpdateTaskById(app, taskId, response, error);

      return res.send({ result });
    }
  });
}
