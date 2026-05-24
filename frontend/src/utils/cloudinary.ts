export type CloudinaryUploadResult = {
  secure_url: string;
  width: number;
  height: number;
  public_id: string;
};

type SignatureResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

const getServerUrl = () => {
  return process.env.NEXT_PUBLIC_SERVER_URL?.trim() || "http://localhost:4000";
};

export const uploadImageToCloudinary = async (file: File) => {
  const signRes = await fetch(`${getServerUrl()}/api/cloudinary/sign`, {
    method: "POST",
  });

  if (!signRes.ok) {
    const payload = await signRes.json().catch(() => ({}));
    throw new Error(payload?.error || "Cloudinary signing failed");
  }

  const signature: SignatureResponse = await signRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", signature.timestamp.toString());
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    const payload = await uploadRes.json().catch(() => ({}));
    throw new Error(payload?.error?.message || "Cloudinary upload failed");
  }

  return (await uploadRes.json()) as CloudinaryUploadResult;
};
