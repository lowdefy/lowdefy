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
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { serializer } from '@lowdefy/helpers';

// Root artifacts served to the Hono app from memory. Loaded back from the
// files the build just wrote — byte-parity with the previous fs-at-import
// wrappers without replicating each writer's shape logic.
const ROOT_ARTIFACTS = ['app', 'appMeta', 'auth', 'config', 'i18n', 'logger', 'theme'];

// In-memory build state shared between the lowdefy() Vite plugin (producer)
// and the SSR-loaded Hono app (consumer, via lib/server/devState.js). Both run
// in the same process — the Vite dev server — so the previous file-based
// signaling (build/reload, build/invalidatePages, cross-process artifact
// re-reads) is replaced by direct state and an event emitter.
function createDevState({ directories }) {
  const state = {
    emitter: new EventEmitter(),

    // Set by setBuild after every shallow build.
    buildContext: null,
    pageRegistry: null,
    components: null,
    artifacts: {},

    // Frozen at the first build — represents what the client bundle imports.
    // JIT-discovered icons ship as inline SVG data (iconsDynamic), not as new
    // imports, so this set only changes on a server restart.
    bundledIconImports: null,

    // JIT page cache — registered by the JIT builder so the plugin can
    // invalidate in-process.
    pageCache: null,

    setBuild({ pageRegistry, context, components }) {
      state.pageRegistry = pageRegistry;
      state.buildContext = context;
      state.components = components;
      for (const name of ROOT_ARTIFACTS) {
        const raw = fs.readFileSync(path.join(directories.build, `${name}.json`), 'utf8');
        state.artifacts[name] = serializer.deserialize(JSON.parse(raw));
      }
      // JIT missing-package detection compares against the installed snapshot.
      context.installedPluginPackages = new Set(context.installedPackages ?? []);
      // JIT CallAPI validation resolves endpointIds from the api configs.
      context.components = { api: components.api ?? [] };
      // Accumulator for dynamically extracted icon SVG data.
      context.dynamicIconData = context.dynamicIconData ?? {};
      if (state.bundledIconImports === null) {
        state.bundledIconImports = components.imports?.icons ?? [];
      }
      context.iconImports = state.bundledIconImports;
      state.invalidatePages();
    },

    invalidatePages() {
      if (state.pageCache) {
        state.pageCache.invalidateAll();
      }
      // The build context lives across invalidations — clear its file read
      // cache so JIT rebuilds re-read edited config files from disk.
      state.buildContext?.configFileCache?.clear();
    },

    reloadClients() {
      state.emitter.emit('reload');
    },
  };
  return state;
}

function publishDevState(state) {
  globalThis.__LOWDEFY_DEV__ = state;
}

export { createDevState, publishDevState };
