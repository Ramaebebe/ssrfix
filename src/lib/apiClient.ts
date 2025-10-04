// src/lib/apiClient.ts
export async function postJSON<TPayload extends object, TResult>(
  url: string,
  payload: TPayload,
  init?: RequestInit
): Promise<TResult> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: JSON.stringify(payload),
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as TResult;
}
