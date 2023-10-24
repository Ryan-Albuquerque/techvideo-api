import { FastifyInstance } from "fastify";
import { z } from "zod";
import { openai } from "../../resources/openai";
import { delay } from "../../utils/delay";
import { UpdateTaskById } from "../../resources/tasks";

export async function GenerateAskMe(app: FastifyInstance) {
  app.post("/", async (req, res) => {
    console.info(`[SERVICE] - Starting ${GenerateAskMe.name}`);

    const taskId = (res as any).locals.taskId;
    let response, error;

    try {
      console.info(`[${GenerateAskMe.name}] - Starting validations`);

      const bodySchema = z.object({
        prompt: z.string(),
        temperature: z.number().optional().default(0.5),
      });

      const { prompt, temperature } = bodySchema.parse(req.body);

      console.info(`[${GenerateAskMe.name}] - Returning taskId: ${taskId}`);

      res.send({ taskId });

      console.info(`[${GenerateAskMe.name}] - Starting AI query`);

      await delay(3000);

      const completionResult = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        temperature,
        messages: [{ role: "user", content: prompt }],
      });

      console.info(
        `[${GenerateAskMe.name}] - AI query completed successfully at ${completionResult.created}`
      );

      response = { completion: completionResult.choices[0].message.content };
    } catch (err) {
      const stringifyError = JSON.stringify(err);
      console.error(
        `[${GenerateAskMe.name}] - Error executing: ${stringifyError}`
      );
      error = JSON.stringify(err);
    } finally {
      await UpdateTaskById(app, taskId, response, error);
      console.info(
        `[${GenerateAskMe.name}] - Updating task result: ${JSON.stringify(
          response
        )} - error: ${JSON.stringify(error)}`
      );
      return;
    }
  });
}
