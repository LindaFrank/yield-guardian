// @ts-ignore Deno resolves npm: imports; the Node regression tests alias this to zod.
import { z } from 'npm:zod@3.25.76';

// Keep-alive callers send no symbols; data actions must still supply at least one.
export const BodySchema = z.object({
  action: z.enum(['ping', 'quote', 'dividends', 'search']),
  tickers: z.array(z.string().min(1).max(100)).max(100).optional(),
}).refine((body) => body.action === 'ping' || Boolean(body.tickers?.length), {
  message: 'tickers array required',
});