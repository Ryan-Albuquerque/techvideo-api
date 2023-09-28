import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {  pipeline } from "node:stream";
import { promisify } from "node:util";
import fs, { unlinkSync } from "node:fs";
import { prisma } from "../database/index";
import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

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

    const S3 = new S3Client({
      region: "auto",
      endpoint: process.env.CLOUDFIRE_ENDPOINT ?? "",
      credentials: {
        accessKeyId: process.env.CLOUDFIRE_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.CLOUDFIRE_SECRET_ACCESS_KEY ?? "",
      },
    });

    //upload
    const resultUpload = await S3.send(
      new PutObjectCommand({
        Bucket: "bucket-audio-techvideo",
        Key: fileUploadName,
        Body: fs.readFileSync(uploadDir),
        ContentType: data.mimetype,
      })
    );

    //se deu bom, remove de temp
    if (resultUpload.$metadata.httpStatusCode == 200) {
      unlinkSync(uploadDir);
    }

    const res = await prisma.video.create({
      data: {
        name: data.filename,
        path: uploadDir,
        uploadName: fileUploadName,
      },
    });

    return response.send(res);
  });
}
