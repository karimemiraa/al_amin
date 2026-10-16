/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';
import os from 'node:os';
import path from 'node:path';

export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    env: { DATA_DIR: path.join(os.tmpdir(), `igh-test-${process.pid}`), APP_SECRET: 'test-secret-not-for-production' },
    pool: 'forks',
    fileParallelism: false,
  },
});
