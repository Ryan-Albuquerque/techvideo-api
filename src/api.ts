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

app.listen().then((address) => console.log(`API running in ${address} port`));
