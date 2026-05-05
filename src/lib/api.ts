export class ApiClientError extends Error {
  status: number;
  code: string;
  requestId?: string;

  constructor(message: string, status: number, code = 'API_ERROR', requestId?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.') => {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error && error.name !== 'AbortError') return error.message;
  return fallback;
};

export const apiFetch = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let code = 'HTTP_ERROR';
    let requestId = response.headers.get('x-request-id') || undefined;

    if (contentType.includes('application/json')) {
      const payload = await response.json().catch(() => null);
      message = payload?.error?.message || payload?.error || message;
      code = payload?.error?.code || code;
      requestId = payload?.error?.requestId || requestId;
    }

    throw new ApiClientError(message, response.status, code, requestId);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

export const postJson = <T>(url: string, body: unknown, init?: RequestInit) =>
  apiFetch<T>(url, {
    ...init,
    method: init?.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: JSON.stringify(body),
  });

export async function readNdjsonStream<T extends { type: string; data?: unknown; error?: { message?: string } }>(
  response: Response,
  onMessage: (message: T) => void
) {
  if (!response.ok) {
    throw new ApiClientError(`Stream failed with status ${response.status}`, response.status);
  }
  if (!response.body) throw new ApiClientError('Streaming is not supported by this browser.', 0, 'STREAM_UNSUPPORTED');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      onMessage(JSON.parse(trimmed) as T);
    }
  }

  if (buffer.trim()) onMessage(JSON.parse(buffer) as T);
}

export async function readSseTextStream(response: Response, onText: (text: string) => void) {
  if (!response.ok) {
    throw new ApiClientError(`Stream failed with status ${response.status}`, response.status);
  }
  if (!response.body) throw new ApiClientError('Streaming is not supported by this browser.', 0, 'STREAM_UNSUPPORTED');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\n\n/);
    buffer = events.pop() || '';

    for (const event of events) {
      const eventType = event.match(/^event:\s*(.+)$/m)?.[1]?.trim();
      if (eventType === 'done') return;
      if (eventType === 'error') throw new ApiClientError('Streaming failed', 500, 'STREAM_FAILED');

      const data = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n');

      if (!data) continue;
      const parsed = JSON.parse(data);
      if (parsed.text) onText(parsed.text);
    }
  }
}
