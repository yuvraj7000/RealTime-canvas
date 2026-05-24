import "dotenv/config";
import http from "http";
import { createApp } from "./app.js";
import { env } from "./utils/env.js";
import { initSocket } from "./socket/index.js";

const app = createApp();
const server = http.createServer(app);

initSocket(server, env.CLIENT_ORIGIN);

server.listen(env.PORT, () => {
  console.log(`Server listening on :${env.PORT}`);
});
