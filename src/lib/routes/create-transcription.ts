import { FastifyInstance } from "fastify";
import { createReadStream } from "node:fs";
import { z } from "zod";
import { prisma } from "../database";
import { openai } from "../resources/openai";
import { downloadFile } from "../resources/cloudflare";
import { readdir, unlink } from "node:fs/promises";
import { getTmpDir, removeFile } from "../utils/fileHandler";

export async function CreateTranscription(app: FastifyInstance) {
  app.post("/:videoId/transcription", async (req, res) => {
    const dir = await getTmpDir();
    try {
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

      await downloadFile(video.uploadName);

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

      const transcription = response.text;

      await prisma.video.update({
        where: {
          id: videoId,
        },
        data: {
          transcription,
        },
      });

      removeFile(video.path)

      return res.send({
        transcription,
      });
    } catch (error) {
      await readdir(dir).then((f) => Promise.all(f.map((e) => unlink(e))));

      return res.send(error).status(400);
    }
  });
}
