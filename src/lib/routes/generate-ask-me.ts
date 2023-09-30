import { FastifyInstance } from "fastify";
import { z } from "zod";
import { openai } from "../resources/openai";
import { OpenAIStream, streamToResponse } from "ai";

export async function GenerateAskMe(app: FastifyInstance) {
  app.post("/", async (req, res) => {
    try {
      const bodySchema = z.object({
        prompt: z.string(),
        temperature: z.number().optional().default(0.5),
      });

      const { prompt, temperature } = bodySchema.parse(req.body);

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        temperature,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      });

      const stream = OpenAIStream(response);

      streamToResponse(stream, res.raw, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
      });
    } catch (error) {
      return res.send(error).status(400);
    }
  });
}
