import { fastify } from "fastify";
import { Routes } from "./lib/routes/routes";
import { fastifyCors } from "@fastify/cors";

const app = fastify();

app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
});

app.register(Routes);

app.listen({ port: 3333 }).then(() => console.log("API running"));
