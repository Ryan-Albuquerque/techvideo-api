import { FastifyInstance } from "fastify";
import { z } from "zod";
import { streamToResponse, OpenAIStream } from "ai";
import { prisma } from "../database";
import { openai } from "../resources/openai";
import { delay } from "../utils/delay";

export async function GenerateAiContent(app: FastifyInstance) {
  app.post("/content", async (req, res) => {
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

    await delay(3000);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      temperature,
      messages: [{ role: "user", content: promptMessage }],
      stream: true,
    });

    const stream = OpenAIStream(response);

    streamToResponse(stream, res.raw, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
    });
  });
}
