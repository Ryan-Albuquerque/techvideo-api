require("dotenv").config();
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

app
  .listen({ port: process.env.IS_LOCAL ? 3333 : 0 })
  .then((address) => console.log(`API running in ${address} port`));
