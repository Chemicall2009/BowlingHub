/**
 * @file src/api/client.ts
 * @description Типизированный клиент запросов с поддержкой формата ошибок RFC 7807 и VITE_API_URL.
 */

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemDetails
  ) {
    super(problem.detail || problem.title || `API Error ${status}`);
    this.name = "ApiError";
  }
}

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = isFormData
    ? { ...options.headers }
    : { "Content-Type": "application/json", ...options.headers };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let problem: ProblemDetails;
    try {
      problem = (await response.json()) as ProblemDetails;
    } catch {
      problem = {
        type: "about:blank",
        title: response.statusText || "Ошибка сети",
        status: response.status,
        detail: `Запрос завершился с ошибкой ${response.status}`,
        instance: endpoint,
      };
    }
    throw new ApiError(response.status, problem);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return request<T>(endpoint, options);
}

/**
 * Выполняет GET-запрос.
 */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  let url = endpoint;
  if (params) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) sp.append(k, String(v));
    });
    const qs = sp.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  return request<T>(url, { method: "GET" });
}

/**
 * Выполняет POST-запрос.
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  return request<T>(endpoint, {
    method: "POST",
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Выполняет PUT-запрос.
 */
export async function apiPut<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return request<T>(endpoint, {
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Выполняет DELETE-запрос.
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, { method: "DELETE" });
}
