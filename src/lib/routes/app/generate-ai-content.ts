import { FastifyInstance } from "fastify";
import { z } from "zod";
import { streamToResponse, OpenAIStream } from "ai";
import { prisma } from "../../database";
import { openai } from "../../resources/openai";
import { delay } from "../../utils/delay";
import { UpdateTaskById } from "../../resources/tasks";

export async function GenerateAiContent(app: FastifyInstance) {
  app.post("/content", async (req, res) => {
    console.info(`[SERVICE] - Starting ${GenerateAiContent.name}`);

    const taskId = (res as any).locals.taskId;
    let response, error;

    try {
      console.info(`[${GenerateAiContent.name}] - Starting validations`);

      const bodySchema = z.object({
        videoId: z.string().uuid(),
        generatorType: z.string(),
        promptValue: z.string().optional(),
        temperature: z.number().min(0).max(1).default(0.5),
      });

      const { videoId, generatorType, temperature, promptValue } =
        bodySchema.parse(req.body);

      const video = await prisma.video.findUniqueOrThrow({
        where: {
          id: videoId,
        },
      });

      if (!video.transcription) {
        return res
          .status(400)
          .send({ error: "Video transcription was not generated yet." });
      }

      let promptTemplate: string | undefined;

      promptTemplate = promptValue;

      if (generatorType !== "customize") {
        const promptResult = await prisma.prompt.findFirst({
          where: {
            title: generatorType,
          },
        });

        promptTemplate = promptResult?.template;
      }

      const promptMessage = promptTemplate?.replace(
        "{transcription}",
        video.transcription
      );

      if (!promptMessage)
        return res.status(400).send({ error: "Prompt is not informed." });

      console.info(`[${GenerateAiContent.name}] - Returning taskId: ${taskId}`);

      res.send({ taskId });

      console.info(`[${GenerateAiContent.name}] - Starting AI query`);

      await delay(3000);

      const completionResult = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        temperature,
        messages: [{ role: "user", content: promptMessage }],
      });

      console.info(
        `[${GenerateAiContent.name}] - AI query completed successfully at ${completionResult.created}`
      );

      response = { completion: completionResult.choices[0].message.content };
    } catch (err) {
      const stringifyError = JSON.stringify(err);
      console.error(
        `[${GenerateAiContent.name}] - Error executing: ${stringifyError}`
      );
      error = err;
    } finally {
      await UpdateTaskById(app, taskId, response, error);
      console.info(
        `[${GenerateAiContent.name}] - Updating task result: ${JSON.stringify(
          response
        )} - error: ${JSON.stringify(error)}`
      );

      return;
    }
  });
}
