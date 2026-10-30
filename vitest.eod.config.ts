import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { 'npm:zod@3.25.76': 'zod' } },
  test: { environment: 'node', include: ['src/lib/eodBatch.test.ts', 'src/lib/stockDataRequest.test.ts'] },
});