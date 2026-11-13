/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import path from 'node:path';
import { fileURLToPath } from 'node:url';
// vite and its React plugin ship exports maps only, which the import plugin's node resolver cannot
// read.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const benchDir = path.dirname(fileURLToPath(import.meta.url));

// Production build of the bench page: React in production mode (the profiling build, so
// <Profiler> reports commit durations), the table from the package's built dist (run
// `pnpm build` first).
export default defineConfig({
  root: path.join(benchDir, 'app'),
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  resolve: {
    dedupe: ['react', 'react-dom', 'antd'],
    // Only the root's entry: the profiling build requires `react-dom` for its shared internals, so
    // aliasing `react-dom` itself makes that require resolve to the profiling build and boot fails.
    alias: [{ find: /^react-dom\/client$/, replacement: 'react-dom/profiling' }],
  },
  build: {
    outDir: path.join(benchDir, '.dist'),
    emptyOutDir: true,
    minify: process.env.BENCH_MINIFY !== 'false',
  },
  logLevel: 'warn',
});
