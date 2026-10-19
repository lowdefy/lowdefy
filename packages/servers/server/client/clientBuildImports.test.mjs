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
import { fileURLToPath } from 'node:url';

// Everything the client imports from build/ ships in the browser bundle. build/config.json is
// server-only: it carries every deployment environment's settings (other environments' urls,
// secret names, email filters). The client learns only the current environment's name and
// switched-off features, through appMeta. This allowlist fails the build of any new client import
// of a build artifact until it has been checked for what it exposes.
const allowed = new Set([
  'auth.json',
  'appMeta.json',
  'logger.json',
  'i18n/antdLocales.js',
  'i18n/antdXLocales.js',
  'i18n/dayjsLocales.js',
  'plugins/blockMetas.json',
  'plugins/operators/clientJsMap.js',
  // Type-set hashes and chunk loaders only - never page ids or config.
  'plugins/pageTypes.js',
]);

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function listSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    return /\.(js|jsx|mjs)$/.test(entry.name) && !entry.name.includes('.test.') ? [full] : [];
  });
}

test('client code imports only client-safe build artifacts', () => {
  const imported = ['client', 'lib/client'].flatMap((dir) =>
    listSourceFiles(path.join(root, dir)).flatMap((file) =>
      [...fs.readFileSync(file, 'utf8').matchAll(/from '[^']*\/build\/([^']+)'/g)].map((match) => ({
        file: path.relative(root, file),
        artifact: match[1],
      }))
    )
  );
  expect(imported.length).toBeGreaterThan(0);
  expect(imported.filter(({ artifact }) => !allowed.has(artifact))).toEqual([]);
});
