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
import devServer from '@hono/vite-dev-server';

// basePath from the Lowdefy build — assets and routes are served under it.
let basePath = '';
try {
  const config = JSON.parse(fs.readFileSync('./build/config.json', 'utf8'));
  basePath = config.basePath ?? '';
} catch (e) {
  // No build yet — default base.
}

export default defineConfig(({ mode }) => ({
  base: `${basePath}/`,
  plugins: [
    react(),
    devServer({
      entry: './src/app.js',
      // Vite serves these itself; everything else routes to the Hono app.
      exclude: [
        /^\/client\/.+/,
        /^\/lib\/.+/,
        /^\/build\/.+/,
        /^\/@.+$/,
        /^\/node_modules\/.*/,
        /\?t=\d+$/,
        /^\/favicon\.ico$/,
      ],
    }),
  ],
  define: {
    // Vite does not replace process.env.NODE_ENV inside dependencies —
    // plugin and client code branch on it.
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  },
  resolve: {
    // linked plugin packages (pnpm link: / workspace) must share one React.
    dedupe: ['react', 'react-dom'],
  },
}));
