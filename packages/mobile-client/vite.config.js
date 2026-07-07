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

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// The Lowdefy build directory holding build/mobile/* artifacts. Defaults to
// the sibling server directory in .lowdefy; the dev manager points it at the
// dev server's build directory instead.
const buildDirectory = process.env.LOWDEFY_DIRECTORY_BUILD
  ? path.resolve(process.env.LOWDEFY_DIRECTORY_BUILD)
  : path.resolve(dirname, '../server/build');

function readServerUrl() {
  // Per-build override for staging/production variants of the same config.
  if (process.env.LOWDEFY_MOBILE_SERVER_URL) {
    return process.env.LOWDEFY_MOBILE_SERVER_URL;
  }
  const mobileConfig = JSON.parse(
    fs.readFileSync(path.join(buildDirectory, 'mobile/config.json'), 'utf8')
  );
  return mobileConfig.serverUrl ?? '';
}

// The generated import files under build/mobile/plugins/* live outside this
// package, so Node-style resolution walks up from the build directory and
// misses this package's node_modules. Resolve their bare imports (plugin
// packages, react-icons) from here instead.
function lowdefyBuildResolver(buildDirectory) {
  return {
    name: 'lowdefy-build-resolver',
    resolveId(source, importer) {
      if (!importer || !importer.startsWith(buildDirectory)) return null;
      if (source.startsWith('.') || source.startsWith('/') || source.startsWith('\0')) return null;
      try {
        return require.resolve(source);
      } catch {
        return null;
      }
    },
  };
}

export default defineConfig(({ command }) => {
  // Dev serves through the Vite proxy below — API calls stay same-origin, so
  // no CORS or cookie special-casing exists in the dev loop.
  const serverUrl = command === 'build' ? readServerUrl() : '';
  const apiPort = process.env.LOWDEFY_MOBILE_API_PORT ?? process.env.PORT ?? '3000';

  return {
    plugins: [react(), lowdefyBuildResolver(buildDirectory)],
    define: {
      __LOWDEFY_MOBILE_SERVER_URL__: JSON.stringify(serverUrl),
    },
    resolve: {
      alias: [{ find: /^build\//, replacement: `${buildDirectory}/` }],
      dedupe: ['react', 'react-dom'],
    },
    build: {
      outDir: 'dist',
    },
    server: {
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          ws: true,
        },
      },
    },
  };
});
