/**
 * @file apiClient.ts
 * @description Centralized HTTP API Client untuk POS Event Kasir.
 *
 * Fitur:
 *  - Base URL dari environment variable (REACT_NATIVE_API_BASE_URL / fallback)
 *  - Auto-inject JWT Bearer Token di setiap request header
 *  - Context header cabang/tenant aktif (X-Branch-Id, X-Tenant-Id, X-Branch-Name)
 *  - Request timeout yang dapat dikonfigurasi (default 15 detik)
 *  - Retry mechanism dengan exponential backoff untuk network error & 5xx
 *  - Error mapping ke ApiError yang terstruktur
 *  - Helper methods: get, post, put, patch, delete
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/** Kode error yang terstandardisasi di seluruh aplikasi. */
export type ApiErrorCode =
  | 'NETWORK_ERROR'   // Tidak ada koneksi / fetch gagal total
  | 'TIMEOUT'         // Request melebihi batas waktu
  | 'UNAUTHORIZED'    // HTTP 401 – token invalid / expired
  | 'FORBIDDEN'       // HTTP 403 – tidak punya hak akses
  | 'NOT_FOUND'       // HTTP 404
  | 'CONFLICT'        // HTTP 409 – data duplikat / konflik
  | 'UNPROCESSABLE'   // HTTP 422 – validasi gagal di server
  | 'SERVER_ERROR'    // HTTP 5xx
  | 'UNKNOWN_ERROR';  // Lainnya

/** Error terstruktur yang dilempar oleh apiClient. */
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

/** Konfigurasi opsional per-request. */
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Body request – akan di-serialize ke JSON otomatis. */
  body?: unknown;
  /** Override timeout (ms) untuk request ini. Default: pakai config global. */
  timeoutMs?: number;
  /** Override jumlah retry untuk request ini. Default: pakai config global. */
  maxRetries?: number;
  /** Jika true, error HTTP tidak dilempar – mengembalikan response mentah. */
  rawResponse?: boolean;
}

/** Shape generic untuk response API yang berhasil. */
export interface ApiResponse<T = unknown> {
  data: T;
  statusCode: number;
  headers: Headers;
}

// =============================================================================
// INTERNAL STATE – TOKEN & CONTEXT STORE
// =============================================================================

/**
 * State internal yang menyimpan token JWT dan context aktif.
 * Diupdate via setter yang diekspor agar bisa dipanggil dari auth flow & setup terminal.
 */
const _store: {
  accessToken: string | null;
  tenantId: string | null;
  branchId: string | null;
  branchName: string | null;
} = {
  accessToken: null,
  tenantId: null,
  branchId: null,
  branchName: null,
};

// =============================================================================
// PUBLIC SETTERS – dipanggil dari LoginScreen / SetupTerminalScreen
// =============================================================================

/**
 * Set JWT access token setelah login berhasil.
 * @example
 *   import { setAccessToken } from '../services/api/apiClient';
 *   setAccessToken(data.token);
 */
export const setAccessToken = (token: string | null): void => {
  _store.accessToken = token;
};

/**
 * Set context cabang & tenant aktif setelah shift dibuka.
 * Header X-Branch-Id, X-Branch-Name, dan X-Tenant-Id akan
 * disertakan secara otomatis di setiap request selanjutnya.
 *
 * @example
 *   import { setActiveContext } from '../services/api/apiClient';
 *   setActiveContext({
 *     tenantId: 'tenant-abc',
 *     branchId: 'branch-01',
 *     branchName: "Let's Go Gelato - Bengawan",
 *   });
 */
export const setActiveContext = (ctx: {
  tenantId?: string | null;
  branchId?: string | null;
  branchName?: string | null;
}): void => {
  if (ctx.tenantId !== undefined)  { _store.tenantId  = ctx.tenantId;  }
  if (ctx.branchId !== undefined)  { _store.branchId  = ctx.branchId;  }
  if (ctx.branchName !== undefined){ _store.branchName = ctx.branchName; }
};

/** Hapus semua auth & context saat logout. */
export const clearApiContext = (): void => {
  _store.accessToken = null;
  _store.tenantId    = null;
  _store.branchId    = null;
  _store.branchName  = null;
};

/** Kembalikan snapshot state internal (read-only) – berguna untuk debugging. */
export const getApiContextSnapshot = () => ({ ..._store });

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Base URL resolusi:
 *  1. process.env.REACT_NATIVE_API_BASE_URL  (di-set di .env atau Metro config)
 *  2. Fallback ke http://10.0.2.2:3000/api/v1  (Android emulator -> localhost)
 *
 * Untuk device fisik, override di .env:
 *   REACT_NATIVE_API_BASE_URL=http://192.168.1.x:3000/api/v1
 */
export const BASE_URL: string =
  (typeof process !== 'undefined' && process.env?.REACT_NATIVE_API_BASE_URL) ||
  'http://10.0.2.2:3000/api/v1';

/** Timeout default per request (ms). */
export const DEFAULT_TIMEOUT_MS = 15_000;

/** Jumlah retry default untuk network error / 5xx. */
export const DEFAULT_MAX_RETRIES = 2;

/** Delay awal exponential backoff (ms). Delay aktual = BASE * 2^attempt. */
const RETRY_BASE_DELAY_MS = 500;

/** HTTP status yang layak di-retry (transient error dari server/gateway). */
const RETRYABLE_STATUS_CODES = new Set([408, 429, 502, 503, 504]);

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/** Tunggu sejumlah milidetik. */
const _sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Buat AbortController dengan timeout otomatis.
 * Mengembalikan controller beserta fungsi cleanup-nya.
 */
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

/** Map HTTP status code ke ApiErrorCode yang terstandardisasi. */
const _mapStatusToCode = (status: number): ApiErrorCode => {
  if (status === 401) { return 'UNAUTHORIZED'; }
  if (status === 403) { return 'FORBIDDEN'; }
  if (status === 404) { return 'NOT_FOUND'; }
  if (status === 409) { return 'CONFLICT'; }
  if (status === 422) { return 'UNPROCESSABLE'; }
  if (status >= 500)  { return 'SERVER_ERROR'; }
  return 'UNKNOWN_ERROR';
};

/**
 * Tentukan apakah request layak di-retry.
 * - GET/HEAD/OPTIONS: retry untuk network error, timeout, dan status transient.
 * - POST/PUT/PATCH/DELETE: hanya retry untuk network error murni & timeout
 *   (aman dari double-mutation).
 */
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

// =============================================================================
// CORE REQUEST FUNCTION
// =============================================================================

/**
 * Eksekusi satu HTTP request dengan timeout dan auto-inject headers.
 * Melempar ApiError jika response tidak OK atau terjadi network/timeout error.
 */
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

  // 1. Susun URL (path absolut maupun relatif)
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  // 2. Susun Headers dengan auto-inject JWT & context
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    // JWT Bearer Token
    ...(_store.accessToken
      ? { Authorization: `Bearer ${_store.accessToken}` }
      : {}),
    // Context cabang/tenant aktif
    ...(_store.tenantId   ? { 'X-Tenant-Id': _store.tenantId }   : {}),
    ...(_store.branchId   ? { 'X-Branch-Id': _store.branchId }   : {}),
    ...(_store.branchName
      ? { 'X-Branch-Name': encodeURIComponent(_store.branchName) }
      : {}),
    // Override header dari caller
    ...(extraHeaders as Record<string, string>),
  };

  // 3. Setup timeout via AbortController
  const { controller, clearTimer } = _makeTimeoutController(timeoutMs);

  // 4. Jalankan fetch
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

  // 5. Mode rawResponse – kembalikan teks mentah, caller bertanggung jawab
  if (rawResponse) {
    return {
      data: (await response.text()) as unknown as T,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  // 6. Parse response body (JSON atau teks)
  let responseBody: unknown = null;
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    try { responseBody = await response.json(); } catch { responseBody = null; }
  } else {
    try { responseBody = await response.text(); } catch { responseBody = null; }
  }

  // 7. Lempar ApiError untuk HTTP error
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

// =============================================================================
// REQUEST WITH RETRY (EXPONENTIAL BACKOFF)
// =============================================================================

/**
 * Wrapper di atas _executeRequest yang menambahkan retry dengan exponential backoff.
 * Delay: 500ms -> 1000ms -> 2000ms -> ... (tergantung DEFAULT_MAX_RETRIES).
 */
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

// =============================================================================
// PUBLIC API CLIENT OBJECT
// =============================================================================

/**
 * Objek apiClient – titik masuk utama untuk semua HTTP call di aplikasi.
 *
 * @example
 * // 1. Login & simpan token
 * import apiClient, { setAccessToken } from './apiClient';
 * const res = await apiClient.post<{ token: string }>('/auth/login', { username });
 * setAccessToken(res.data.token);
 *
 * // 2. Set context cabang setelah shift dibuka
 * import { setActiveContext } from './apiClient';
 * setActiveContext({ tenantId: 'T01', branchId: 'B01', branchName: "Let's Go Gelato" });
 *
 * // 3. GET products – Bearer Token & context header otomatis disertakan
 * const products = await apiClient.get<Product[]>('/products');
 *
 * // 4. POST checkout
 * const draft = await apiClient.post<DraftResponseData>('/checkout/draft', payload);
 *
 * // 5. Handle error
 * import { ApiError } from './apiClient';
 * try {
 *   await apiClient.post('/checkout/confirm', payload);
 * } catch (err) {
 *   if (err instanceof ApiError) {
 *     if (err.code === 'UNAUTHORIZED') { // redirect ke login }
 *     if (err.code === 'NETWORK_ERROR') { // simpan ke offline queue }
 *   }
 * }
 */
const apiClient = {
  /**
   * HTTP GET
   * @param path     - path relatif dari BASE_URL, atau URL absolut
   * @param options  - RequestOptions opsional (timeoutMs, headers, dll.)
   */
  get: <T = unknown>(
    path: string,
    options?: Omit<RequestOptions, 'body'>,
  ): Promise<ApiResponse<T>> =>
    _requestWithRetry<T>('GET', path, options),

  /**
   * HTTP POST
   * @param path    - path relatif atau URL absolut
   * @param body    - payload request (akan di-JSON.stringify)
   * @param options - RequestOptions opsional
   */
  post: <T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> =>
    _requestWithRetry<T>('POST', path, { ...options, body }),

  /**
   * HTTP PUT
   * @param path    - path relatif atau URL absolut
   * @param body    - payload request
   * @param options - RequestOptions opsional
   */
  put: <T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> =>
    _requestWithRetry<T>('PUT', path, { ...options, body }),

  /**
   * HTTP PATCH
   * @param path    - path relatif atau URL absolut
   * @param body    - payload parsial request
   * @param options - RequestOptions opsional
   */
  patch: <T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> =>
    _requestWithRetry<T>('PATCH', path, { ...options, body }),

  /**
   * HTTP DELETE
   * @param path    - path relatif atau URL absolut
   * @param options - RequestOptions opsional
   */
  delete: <T = unknown>(
    path: string,
    options?: Omit<RequestOptions, 'body'>,
  ): Promise<ApiResponse<T>> =>
    _requestWithRetry<T>('DELETE', path, options),
};

export default apiClient;
