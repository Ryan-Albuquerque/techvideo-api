require("dotenv").config();
import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyRedis from "@fastify/redis";
import { Routes } from "./lib/routes/routes";

const app = fastify({ logger: true });

app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
});

app.register(fastifyRedis, {
  url: process.env.REDIS_URL,
  connectTimeout: 10000,
});

app.register(Routes);

app.listen({ port: process.env.IS_LOCAL ? 3333 : 0 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`API running on ${address}`);
});
