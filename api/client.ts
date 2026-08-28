import { env } from '@/env';
import { getAuthToken } from '@/lib/auth-session';
import { waitForMsw } from '@/lib/msw-ready';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * The single HTTP entry point. Every domain module (api/contacts.ts, …)
 * goes through this function, never through fetch/axios directly.
 *
 * At handover, this layer is replaced by a generated OpenAPI client
 * (@hey-api/openapi-ts) — the domain modules keep their signatures and
 * no component changes.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  await waitForMsw();

  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
