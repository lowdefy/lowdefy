#!/usr/bin/env node

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

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Register CSS/LESS no-op loader before any plugin imports.
register('./css-noop-loader.js', import.meta.url);

// Module files to auto-detect and the type category they map to.
const MODULE_FILES = [
  'blocks.js',
  'connections.js',
  'actions.js',
  'operatorsClient.js',
  'operatorsServer.js',
  'auth/adapters.js',
  'auth/callbacks.js',
  'auth/events.js',
  'auth/providers.js',
];

async function main() {
  const cwd = process.cwd();
  const distDir = resolve(cwd, 'dist');
  const srcDir = resolve(cwd, 'src');

  // Use dist/ if it contains at least one known module file, otherwise fall back to src/.
  const hasDistModules = MODULE_FILES.some((file) => existsSync(resolve(distDir, file)));
  const baseDir = hasDistModules ? distDir : srcDir;

  const types = {};

  for (const file of MODULE_FILES) {
    const filePath = resolve(baseDir, file);
    if (!existsSync(filePath)) continue;

    const mod = await import(pathToFileURL(filePath).href);
    const entries = Object.entries(mod).filter(([key]) => key !== 'default');

    if (file === 'blocks.js') {
      types.blocks = entries.map(([name]) => name);
      types.icons = {};
      for (const [name, block] of entries) {
        types.icons[name] = block.meta?.icons ?? [];
      }
    } else if (file === 'connections.js') {
      types.connections = entries.map(([name]) => name);
      types.requests = entries.map(([, conn]) => Object.keys(conn.requests ?? {})).flat();
    } else if (file === 'actions.js') {
      types.actions = entries.map(([name]) => name);
    } else if (file === 'operatorsClient.js') {
      if (!types.operators) types.operators = {};
      types.operators.client = entries.map(([name]) => name);
    } else if (file === 'operatorsServer.js') {
      if (!types.operators) types.operators = {};
      types.operators.server = entries.map(([name]) => name);
    } else if (file.startsWith('auth/')) {
      if (!types.auth) types.auth = {};
      const authType = file.replace('auth/', '').replace('.js', '');
      types.auth[authType] = entries.map(([name]) => name);
    }
  }

  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }
  writeFileSync(resolve(distDir, 'types.json'), JSON.stringify(types, null, 2) + '\n');
}

main();
