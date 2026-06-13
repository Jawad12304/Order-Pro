export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...restOptions } = options;

  const headers = new Headers(customHeaders);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers,
    ...restOptions,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
