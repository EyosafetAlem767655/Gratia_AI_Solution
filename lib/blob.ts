import { put } from "@vercel/blob";

export async function uploadBuffer(
  filename: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  }

  const blob = await put(filename, data, {
    access: "public",
    contentType,
    token,
  });

  return blob.url;
}

export async function uploadFromUrl(
  filename: string,
  url: string,
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType =
    response.headers.get("content-type") ?? "application/octet-stream";

  return uploadBuffer(filename, buffer, contentType);
}
