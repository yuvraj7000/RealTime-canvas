import cors from "cors";
import crypto from "crypto";
import express from "express";
import { env } from "./utils/env.js";
import { parseOrigins } from "./utils/origins.js";

export const createApp = () => {
  const app = express();
  const origins = parseOrigins(env.CLIENT_ORIGIN);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (origins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/cloudinary/sign", (_req, res) => {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      env;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return res.status(400).json({
        error: "Cloudinary env vars not configured",
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = env.CLOUDINARY_FOLDER || "canvas-bord";
    const signatureBase = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto
      .createHash("sha1")
      .update(signatureBase)
      .digest("hex");

    return res.json({
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      timestamp,
      folder,
      signature,
    });
  });

  return app;
};
