import crypto from "crypto";
import { env } from "./env.js";

export const deleteCloudinaryImage = async (publicId: string) => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signatureBase = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto
    .createHash("sha1")
    .update(signatureBase)
    .digest("hex");

  const formData = new URLSearchParams();
  formData.append("public_id", publicId);
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);

  await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
    {
      method: "POST",
      body: formData,
    }
  );
};
