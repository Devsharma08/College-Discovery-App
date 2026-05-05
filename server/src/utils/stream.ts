import { Response } from 'express';

type StreamPayload = {
  type: string;
  data?: unknown;
  error?: { message: string };
};

export const beginNdjsonStream = (res: Response) => {
  res.status(200);
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx/Render
  res.flushHeaders?.();
};

export const writeNdjson = (res: Response, payload: StreamPayload) => {
  res.write(`${JSON.stringify(payload)}\n`);
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
