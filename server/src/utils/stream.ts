import { Response } from 'express';

type StreamPayload = {
  type: string;
  data?: unknown;
  error?: { message: string };
};

export const beginNdjsonStream = (res: Response) => {
  res.status(200);
  (res as any).setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  (res as any).setHeader('Cache-Control', 'no-cache, no-transform');
  (res as any).setHeader('Connection', 'keep-alive');
  (res as any).setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx/Render
  (res as any).flushHeaders?.();
};

export const writeNdjson = (res: Response, payload: StreamPayload) => {
  (res as any).write(`${JSON.stringify(payload)}\n`);
};

export const streamSection = async <T>(
  res: Response,
  type: string,
  loader: () => Promise<T>
) => {
  try {
    const data = await loader();
    writeNdjson(res, { type, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : `Failed to load ${type}`;
    writeNdjson(res, { type, error: { message } });
  }
};
