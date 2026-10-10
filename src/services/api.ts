/**
 * api.ts
 * --------------------------------------------------------------------------
 * Talks to the Friends server. Every answer is JSON. Errors come back as an
 * ApiError with an easy-English message the screens can show directly.
 */
import { SERVER_URL } from '../config';

export class ApiError extends Error {
  /** 0 = the server could not be reached at all. */
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const CANT_REACH =
  "Can't reach the Friends server. Ask a grown-up to check that it is running.";

interface RequestOptions {
  token?: string | null;
  body?: unknown;
  /** A FormData upload (voice messages) instead of JSON. */
  form?: FormData;
}

/** Sends one request and returns the JSON answer. */
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  { token, body, form }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  // Give up after 15 seconds, so the app never hangs.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(`${SERVER_URL}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, CANT_REACH);
  } finally {
    clearTimeout(timer);
  }
  let data: { error?: string } = {};
  try {
    data = await response.json();
  } catch {
    // no JSON body
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error ?? 'Something went wrong. Please try again.',
    );
  }
  return data as T;
}
