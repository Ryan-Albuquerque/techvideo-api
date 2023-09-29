import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import path from "node:path";
import { prisma } from "../database/index";
import { uploadFile } from "../resources/cloudflare";

export async function UploadVideo(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_848_576 * 150,
    },
  });

  app.post("/", async (request, response) => {
    try {
      const data = await request.file();

      if (!data) {
        return response.status(400).send({ error: "not send videos" });
      }

      const extension = path.extname(data.filename);

      if (extension !== ".mp3") {
        return response.status(400).send({ error: "invalid format" });
      }

      const { fileUploadName, uploadDir } = await uploadFile(data);

      const res = await prisma.video.create({
        data: {
          name: data.filename,
          path: uploadDir,
          uploadName: fileUploadName,
        },
      });
      return response.send(res);
    } catch (error) {
      return response.status(400).send(error);
    }
  });
}
