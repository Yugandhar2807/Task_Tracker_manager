type FetchOpts = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T = unknown>(url: string, opts: FetchOpts = {}): Promise<T> {
  const { body, headers, ...rest } = opts;
  const res = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(headers as Record<string, string> | undefined),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in (data as Record<string, unknown>) &&
        ((data as Record<string, unknown>).error as string)) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public payload?: unknown) {
    super(message);
  }
}

export const api = {
  get: <T = unknown>(url: string, opts?: FetchOpts) =>
    request<T>(url, { ...opts, method: "GET" }),
  post: <T = unknown>(url: string, body?: unknown, opts?: FetchOpts) =>
    request<T>(url, { ...opts, method: "POST", body }),
  put: <T = unknown>(url: string, body?: unknown, opts?: FetchOpts) =>
    request<T>(url, { ...opts, method: "PUT", body }),
  del: <T = unknown>(url: string, opts?: FetchOpts) =>
    request<T>(url, { ...opts, method: "DELETE" }),
};
