import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

async function startServer() {
  await connectDatabase(env.MONGODB_URI);
  const app = createApp();

  app.listen(env.PORT, "::", () => {
    console.log(`InsightForge AI API listening on port ${env.PORT}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
