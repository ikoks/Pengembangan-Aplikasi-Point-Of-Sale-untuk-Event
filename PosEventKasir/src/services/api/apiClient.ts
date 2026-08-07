export type ApiErrorCode =
  | 'NETWORK_ERROR'   
  | 'TIMEOUT'         
  | 'UNAUTHORIZED'    
  | 'FORBIDDEN'       
  | 'NOT_FOUND'       
  | 'CONFLICT'        
  | 'UNPROCESSABLE'   
  | 'SERVER_ERROR'    
  | 'UNKNOWN_ERROR';  
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number | null;
  public readonly payload: unknown;
  constructor(
    message: string,
    code: ApiErrorCode,
    statusCode: number | null = null,
    payload: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.payload = payload;
  }
}
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeoutMs?: number;
  maxRetries?: number;
  rawResponse?: boolean;
}
export interface ApiResponse<T = unknown> {
  data: T;
  statusCode: number;
  headers: Headers;
}
const _store: {
  accessToken: string | null;
  tenantId: string | null;
  branchId: string | null;
  branchName: string | null;
  baseUrl: string;
} = {
  accessToken: null,
  tenantId: null,
  branchId: null,
  branchName: null,
  baseUrl: 'https://latter-removing-legwarmer.ngrok-free.dev',
};
export const setApiBaseUrl = (url: string): void => {
  if (url && url.trim()) {
    _store.baseUrl = url.trim().replace(/\/+$/, '');
  }
};
export const getApiBaseUrl = (): string => _store.baseUrl;
export const resetApiBaseUrlToDefault = (): void => {
  _store.baseUrl = 'https://latter-removing-legwarmer.ngrok-free.dev';
};
export const setAccessToken = (token: string | null): void => {
  _store.accessToken = token;
};
export const setActiveContext = (ctx: {
  tenantId?: string | null;
  branchId?: string | null;
  branchName?: string | null;
}): void => {
  if (ctx.tenantId !== undefined)  { _store.tenantId  = ctx.tenantId;  }
  if (ctx.branchId !== undefined)  { _store.branchId  = ctx.branchId;  }
  if (ctx.branchName !== undefined){ _store.branchName = ctx.branchName; }
};
export const clearApiContext = (): void => {
  _store.accessToken = null;
  _store.tenantId    = null;
  _store.branchId    = null;
  _store.branchName  = null;
};
export const getApiContextSnapshot = () => ({ ..._store });
export const BASE_URL: string = _store.baseUrl;
export const DEFAULT_TIMEOUT_MS = 15_000;
export const DEFAULT_MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 502, 503, 504]);
const _sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
const _makeTimeoutController = (
  timeoutMs: number,
): { controller: AbortController; clearTimer: () => void } => {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    controller,
    clearTimer: () => clearTimeout(timerId),
  };
};
const _mapStatusToCode = (status: number): ApiErrorCode => {
  if (status === 401) { return 'UNAUTHORIZED'; }
  if (status === 403) { return 'FORBIDDEN'; }
  if (status === 404) { return 'NOT_FOUND'; }
  if (status === 409) { return 'CONFLICT'; }
  if (status === 422) { return 'UNPROCESSABLE'; }
  if (status >= 500)  { return 'SERVER_ERROR'; }
  return 'UNKNOWN_ERROR';
};
const _isRetryable = (error: ApiError, method: string): boolean => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  const isIdempotent = safeMethods.includes(method.toUpperCase());
  if (!isIdempotent) {
    return error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT';
  }
  return (
    error.code === 'NETWORK_ERROR' ||
    error.code === 'TIMEOUT' ||
    (error.statusCode !== null && RETRYABLE_STATUS_CODES.has(error.statusCode))
  );
};
const _executeRequest = async <T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  const {
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers: extraHeaders = {},
    rawResponse = false,
    ...restInit
  } = options;
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(_store.accessToken
      ? { Authorization: `Bearer ${_store.accessToken}` }
      : {}),
    ...(_store.tenantId   ? { 'X-Tenant-Id': _store.tenantId }   : {}),
    ...(_store.branchId   ? { 'X-Branch-Id': _store.branchId }   : {}),
    ...(_store.branchName
      ? { 'X-Branch-Name': encodeURIComponent(_store.branchName) }
      : {}),
    ...(extraHeaders as Record<string, string>),
  };
  const { controller, clearTimer } = _makeTimeoutController(timeoutMs);
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      ...restInit,
    });
  } catch (fetchError: unknown) {
    clearTimer();
    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      throw new ApiError(
        `Request timeout setelah ${timeoutMs}ms: ${method} ${url}`,
        'TIMEOUT',
        null,
      );
    }
    throw new ApiError(
      `Network error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
      'NETWORK_ERROR',
      null,
    );
  } finally {
    clearTimer();
  }
  if (rawResponse) {
    return {
      data: (await response.text()) as unknown as T,
      statusCode: response.status,
      headers: response.headers,
    };
  }
  let responseBody: unknown = null;
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    try { responseBody = await response.json(); } catch { responseBody = null; }
  } else {
    try { responseBody = await response.text(); } catch { responseBody = null; }
  }
  if (!response.ok) {
    const code = _mapStatusToCode(response.status);
    const message =
      (responseBody as { message?: string })?.message ||
      (responseBody as { error?: string })?.error   ||
      `HTTP ${response.status}: ${method} ${url}`;
    throw new ApiError(message, code, response.status, responseBody);
  }
  return {
    data: responseBody as T,
    statusCode: response.status,
    headers: response.headers,
  };
};
const _requestWithRetry = async <T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  let lastError: ApiError | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await _executeRequest<T>(method, path, options);
    } catch (err: unknown) {
      if (!(err instanceof ApiError)) {
        throw new ApiError(
          err instanceof Error ? err.message : String(err),
          'UNKNOWN_ERROR',
        );
      }
      lastError = err;
      const willRetry = attempt < maxRetries && _isRetryable(err, method);
      if (!willRetry) { break; }
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        `[ApiClient] Retry ${attempt + 1}/${maxRetries} – ${method} ${path}` +
        ` (error: ${err.code}, status: ${err.statusCode ?? 'N/A'}) – delay ${delay}ms`,
      );
      await _sleep(delay);
    }
  }
  throw lastError!;
};
const apiClient = {
  get: <T = unknown>(
    path: string,
    options?: Omit<RequestOptions, 'body'>,
  ): Promise<ApiResponse<T>> =>
    _requestWithRetry<T>('GET', path, options),
  post: <T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> =>
    _requestWithRetry<T>('POST', path, { ...options, body }),
  put: <T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> =>
    _requestWithRetry<T>('PUT', path, { ...options, body }),
  patch: <T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> =>
    _requestWithRetry<T>('PATCH', path, { ...options, body }),
  delete: <T = unknown>(
    path: string,
    options?: Omit<RequestOptions, 'body'>,
  ): Promise<ApiResponse<T>> =>
    _requestWithRetry<T>('DELETE', path, options),
};
export default apiClient;