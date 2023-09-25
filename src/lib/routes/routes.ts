import { FastifyInstance } from "fastify";
import { UploadVideo } from "./upload-video";
import { CreateTranscription } from "./create-transcription";
import { GenerateAiContent } from "./generate-ai-content";

export async function Routes(app: FastifyInstance) {
  app.register(UploadVideo, { prefix: "/video" });
  app.register(CreateTranscription, { prefix: "/video" });
  app.register(GenerateAiContent, { prefix: "/ai" });
}
