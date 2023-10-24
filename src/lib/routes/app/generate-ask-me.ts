import { FastifyInstance } from "fastify";
import { z } from "zod";
import { openai } from "../../resources/openai";
import { delay } from "../../utils/delay";
import { UpdateTaskById } from "../../resources/tasks";

export async function GenerateAskMe(app: FastifyInstance) {
  app.post("/", async (req, res) => {
    const taskId = (res as any).locals.taskId;
    let response, error;

    try {
      const bodySchema = z.object({
        prompt: z.string(),
        temperature: z.number().optional().default(0.5),
      });

      const { prompt, temperature } = bodySchema.parse(req.body);

      res.send({ taskId });

      await delay(3000);

      const completionResult = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        temperature,
        messages: [{ role: "user", content: prompt }],
      });

      response = { completion: completionResult.choices[0].message.content };
    } catch (error) {
      error = JSON.stringify(error);
    } finally {
      const result = await UpdateTaskById(app, taskId, response, error);
      return res.send({ result });
    }
  });
}
