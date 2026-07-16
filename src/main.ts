import mongoose from "mongoose";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import serverlessExpress from "@vendia/serverless-express";
mongoose.set("strictQuery", false);
let cachedHandler: ReturnType<typeof serverlessExpress>;

async function createApp() {
  const app = await NestFactory.create(AppModule);

  // Set trust proxy for Express behind reverse proxy (AWS API Gateway)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Let API Gateway handle CORS instead of NestJS
  app.enableCors({
    origin: (origin, callback) => {
      callback(null, true); // allow all, safe for backend
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: false,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  const httpServer = app.getHttpAdapter().getInstance();
  httpServer.keepAliveTimeout = 120_000;
  httpServer.headersTimeout = 120_000;

  return httpServer;
}

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    const app = await createApp();
    cachedHandler = serverlessExpress({ app });
  }
  return cachedHandler(event, context, undefined);
};

if (process.env.IS_LOCAL === "true") {
  createApp()
    .then((app) => {
      const port = process.env.APP_PORT || 3020;
      app.listen(port, () => {
        console.log(`🚀 Local server running on http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error("❌ Error starting local server:", err);
    });
}
