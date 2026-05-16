import { API_URL } from '@/constants';
import { ApiError, ApiResponse, PaginatedResponse } from '@/types';

const DEFAULT_TIMEOUT = 10000;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();
    return {
      message: data.message || `HTTP ${response.status}`,
      status: response.status,
      errors: data.errors,
    };
  } catch {
    return {
      message: `HTTP ${response.status}`,
      status: response.status,
    };
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        ...headers,
        ...fetchOptions.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await parseErrorResponse(response);
      throw error;
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw { message: 'Request timeout', status: 408 };
    }

    if ((error as ApiError).status) {
      throw error;
    }

    throw { message: 'Network error', status: 0 };
  }
}

export async function get<T>(endpoint: string, options?: RequestInit & { timeout?: number }): Promise<ApiResponse<T> | PaginatedResponse<T>> {
  return apiFetch(endpoint, { ...options, method: 'GET' });
}

export async function post<T>(endpoint: string, body?: unknown, options?: RequestInit & { timeout?: number }): Promise<ApiResponse<T>> {
  return apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function put<T>(endpoint: string, body?: unknown, options?: RequestInit & { timeout?: number }): Promise<ApiResponse<T>> {
  return apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function del<T>(endpoint: string, options?: RequestInit & { timeout?: number }): Promise<ApiResponse<T>> {
  return apiFetch(endpoint, { ...options, method: 'DELETE' });
}