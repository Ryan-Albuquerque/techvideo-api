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

  app.post("/", async (req, res) => {
    try {
      const data = await req.file();

      if (!data) {
        return res.status(400).send({ error: "not send videos" });
      }

      const extension = path.extname(data.filename);

      if (extension !== ".mp3") {
        return res.status(400).send({ error: "invalid format" });
      }

      const { fileUploadName, uploadDir } = await uploadFile(data);

      const response = await prisma.video.create({
        data: {
          name: data.filename,
          path: uploadDir,
          uploadName: fileUploadName,
        },
      });
      return res.send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  });
}
