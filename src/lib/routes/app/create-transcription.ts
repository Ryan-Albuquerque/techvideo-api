import { FastifyInstance } from "fastify";
import { createReadStream } from "node:fs";
import { z } from "zod";
import { prisma } from "../../database";
import { openai } from "../../resources/openai";
import { DownloadFile } from "../../resources/cloudflare";
import { readdir, unlink } from "node:fs/promises";
import { getTmpDir, removeFile } from "../../utils/fileHandler";
import { UpdateTaskById } from "../../resources/tasks";

export async function CreateTranscription(app: FastifyInstance) {
  app.post("/:videoId/transcription", async (req, res) => {
    const taskId = (res as any).locals.taskId;
    let response, error;

    const dir = await getTmpDir();
    try {
      const paramsSchema = z.object({
        videoId: z.string().uuid(),
      });

      const { videoId } = paramsSchema.parse(req.params);

      const bodySchema = z.object({
        prompt: z.string().optional(),
      });

      const body = bodySchema.parse(req.body);

      const video = await prisma.video.findUniqueOrThrow({
        where: {
          id: videoId,
        },
      });

      if (!video) {
        return res.status(400).send({ message: "No video found" });
      }

      console.info(
        `[${CreateTranscription.name}] - Returning taskId: ${taskId}`
      );

      res.send({ taskId });

      await DownloadFile(video.uploadName);

      const videoPath = video.path;
      const audioReadStream = createReadStream(videoPath);

      console.info(`[${CreateTranscription.name}] - Starting AI query`);

      const result = await openai.audio.transcriptions.create({
        file: audioReadStream,
        model: "whisper-1",
        language: "en",
        response_format: "json",
        temperature: 0,
        prompt: body.prompt,
      });

      console.info(
        `[${CreateTranscription.name}] - AI query completed successfully: ${result.text}`
      );

      const transcription = result.text;

      await prisma.video.update({
        where: {
          id: videoId,
        },
        data: {
          transcription,
        },
      });

      removeFile(video.path);

      response = { transcription };
    } catch (err) {
      await readdir(dir).then((f) => Promise.all(f.map((e) => unlink(e))));

      const stringifyError = JSON.stringify(err);
      console.error(
        `[${CreateTranscription.name}] - Error executing: ${stringifyError}`
      );

      error = err;
    } finally {
      await UpdateTaskById(app, taskId, response, error as object);

      console.info(
        `[${CreateTranscription.name}] - Updating task result: ${JSON.stringify(
          response
        )} - error: ${JSON.stringify(error)}`
      );

      return;
    }
  });
}
