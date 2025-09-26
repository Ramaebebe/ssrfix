export async function getSignedUrl(bucket: string, path: string, expiresInSeconds = 120): Promise<string> {
  const res = await fetch("/api/storage/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, path, expiresIn: expiresInSeconds }),
  });
  if (!res.ok) throw new Error("Failed to mint signed URL");
  const { url } = await res.json();
  return url as string;
}
