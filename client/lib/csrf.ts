// Simple fetch wrapper (no CSRF needed for local API)
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  return fetch(`http://localhost:3001${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}
