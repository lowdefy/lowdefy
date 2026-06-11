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

import createPluginContext from './context.mjs';
import startWatchers from './watchers.mjs';
import { createDevState, publishDevState } from './devState.mjs';

// The lowdefy() Vite plugin owns dev orchestration in-process:
//   - config hook: .env, initial shallow build, plugin install, and the Vite
//     base path resolved from the build (no pre-build step, no second process)
//   - configureServer hook: config/module/.env/package.json watchers
//   - restarts: process.exit(87) — the supervisor (manager/supervisor.mjs)
//     respawns with a fresh native ESM cache
// Build state is published on globalThis for the SSR-loaded Hono app
// (lib/server/devState.js) — producer and consumer share this process.
function lowdefy() {
  const context = createPluginContext();
  const state = createDevState({ directories: context.directories });
  context.state = state;
  publishDevState(state);

  return {
    name: 'lowdefy',
    async config() {
      context.readDotEnv();
      const result = await context.lowdefyBuild();
      state.setBuild(result);
      await context.checkMockUserWarning();
      await context.installPlugins();
      const basePath = state.artifacts.config.basePath ?? '';
      return { base: `${basePath}/` };
    },
    configureServer(server) {
      context.viteServer = server;
      startWatchers(context);
    },
  };
}

export default lowdefy;
