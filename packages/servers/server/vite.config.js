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

import fs from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// basePath from the Lowdefy build — assets are served under it.
let basePath = '';
try {
  const config = JSON.parse(fs.readFileSync('./build/config.json', 'utf8'));
  basePath = config.basePath ?? '';
} catch (e) {
  // No build yet (e.g. editor tooling) — default base.
}

const uploadSourceMaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default defineConfig(({ mode }) => ({
  base: `${basePath}/`,
  plugins: [
    react(),
    uploadSourceMaps &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
  ].filter(Boolean),
  define: {
    // Vite does not replace process.env.NODE_ENV inside dependencies —
    // plugin and client code branch on it.
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  },
  build: {
    outDir: 'dist/client',
    manifest: true,
    sourcemap: uploadSourceMaps,
    rollupOptions: {
      input: 'client/main.jsx',
    },
  },
  resolve: {
    // linked plugin packages (pnpm link: / workspace) must share one React.
    dedupe: ['react', 'react-dom'],
  },
}));
