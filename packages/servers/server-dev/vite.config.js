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
import { WebSocketServer } from 'ws';

// basePath from the Lowdefy build — assets and routes are served under it.
let basePath = '';
try {
  const config = JSON.parse(fs.readFileSync('./build/config.json', 'utf8'));
  basePath = config.basePath ?? '';
} catch (e) {
  // No build yet — default base.
}

// Vite owns the HTTP server in dev, so /api/websocket upgrades are handled
// here instead of @hono/node-server. The upgrade handler module is loaded
// through Vite's SSR graph so it shares the Hono app and @lowdefy/api module
// instances with the dev server routes. Vite's own HMR websocket uses a
// different path and is untouched.
function lowdefyWebSocket() {
  return {
    name: 'lowdefy-websocket',
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 });
      server.httpServer?.on('upgrade', async (request, socket, head) => {
        const { pathname } = new URL(request.url ?? '/', 'http://localhost');
        if (pathname !== `${basePath}/api/websocket`) {
          return;
        }
        try {
          const { handleWebSocketUpgrade } = await server.ssrLoadModule(
            './src/websocket/devWebSocket.js'
          );
          await handleWebSocketUpgrade({ request, socket, head, wss });
        } catch (error) {
          console.error(error);
          socket.destroy();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: `${basePath}/`,
  plugins: [
    react(),
    lowdefyWebSocket(),
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
  optimizeDeps: {
    // There is no index.html in the root (the Hono app renders HTML), so the
    // dependency scanner has nothing to crawl and would discover client deps
    // lazily at first request — ending in a mid-session "optimized
    // dependencies changed" full reload. The client entry reaches every
    // plugin import statically (main.jsx → App → Routing → build/plugins/*),
    // so a startup crawl discovers the full set. Linked workspace plugins are
    // intentionally not pre-bundled (Vite default) so local plugin edits stay
    // live.
    entries: ['client/main.jsx'],
  },
  resolve: {
    // linked plugin packages (pnpm link: / workspace) must share one React.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    watch: {
      // Tailwind scan inputs are rewritten by JIT page builds, and Vite
      // full-reloads the browser on any watched .html change — killing
      // in-flight requests on every first page visit. CSS recompilation does
      // not need these events: globals.css imports build/tailwind-candidates.css,
      // which the JIT builder touches whenever tailwind content changes (the
      // sole recompile trigger — see writeGlobalsCss in @lowdefy/build).
      ignored: ['**/lowdefy-build/tailwind/**'],
    },
  },
}));
