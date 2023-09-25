import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import fs from "node:fs";
import { prisma } from "../database/index";

const pump = promisify(pipeline);

export async function UploadVideo(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_848_576 * 150,
    },
  });

  app.post("/", async (request, response) => {
    const data = await request.file();

    if (!data) {
      return response.status(400).send({ error: "not send videos" });
    }

    const extension = path.extname(data.filename);

    if (extension !== ".mp3") {
      return response.status(400).send({ error: "invalid format" });
    }

    const filebaseName = path.basename(data.filename, extension);

    const fileUploadName = `${filebaseName}-${randomUUID()}${extension}`;

    const uploadDir = path.resolve(__dirname, "../../tmp", fileUploadName);

    await pump(data.file, fs.createWriteStream(uploadDir));

    const res = await prisma.video.create({
      data: {
        name: data.filename,
        path: uploadDir,
      },
    });

    return response.send(res);
  });
}
