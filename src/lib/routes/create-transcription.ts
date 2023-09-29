require("dotenv").config();

import { FastifyInstance } from "fastify";
import { createReadStream, createWriteStream, unlinkSync } from "node:fs";
import { z } from "zod";
import { prisma } from "../database";
import { openai } from "../resources/openai";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import path from "node:path";

export async function CreateTranscription(app: FastifyInstance) {
  app.post("/:videoId/transcription", async (req) => {
    const paramsSchema = z.object({
      videoId: z.string().uuid(),
    });

    const { videoId } = paramsSchema.parse(req.params);

    const bodySchema = z.object({
      prompt: z.string().optional(),
    });

    const { prompt } = bodySchema.parse(req.body);

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      },
    });

    const S3 = new S3Client({
      region: "auto",
      endpoint: process.env.CLOUDFIRE_ENDPOINT ?? "",
      credentials: {
        accessKeyId: process.env.CLOUDFIRE_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.CLOUDFIRE_SECRET_ACCESS_KEY ?? "",
      },
    });

    const downloadFile = await S3.send(
      new GetObjectCommand({
        Bucket: "bucket-audio-techvideo",
        Key: video.uploadName,
      })
    );

    const setTmpFile = new Promise(async (resolve, reject) => {
      const body = downloadFile.Body;
      if (body instanceof Readable) {
        const uploadDir = path.resolve(
          __dirname,
          "../../tmp",
          video.uploadName
        );

        body
          .pipe(createWriteStream(uploadDir))
          .on("error", (err) => reject(err))
          .on("close", () => resolve("success"));
      }
    });

    await setTmpFile;

    const videoPath = video.path;
    const audioReadStream = createReadStream(videoPath);

    const response = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
      language: "en",
      response_format: "json",
      temperature: 0,
      prompt,
    });

    unlinkSync(videoPath);

    const transcription = response.text;

    await prisma.video.update({
      where: {
        id: videoId,
      },
      data: {
        transcription,
      },
    });

    return {
      transcription,
    };
  });
}
