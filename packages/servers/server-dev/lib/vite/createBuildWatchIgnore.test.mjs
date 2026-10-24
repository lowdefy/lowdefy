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
import { expect, test } from 'vitest';

import { createBuildWatchIgnore, getWatchedBuildEntries } from './createBuildWatchIgnore.js';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '../..');

test('the derived watch list holds what the client and server import', () => {
  const { files, folders } = getWatchedBuildEntries({ root });
  expect(files).toEqual(
    expect.arrayContaining(['auth.json', 'theme.json', 'layer-order.css', 'globals.css'])
  );
  expect(folders).toEqual(expect.arrayContaining(['plugins', 'i18n']));
});

test('derived watch list matches the allowlist of imported artifacts', () => {
  const { files, folders } = getWatchedBuildEntries({ root });
  expect(folders).toEqual(['i18n', 'plugins']);
  // Server wrappers (lib/build/*.js) read JSON by fs, not import; they are not in this list.
  expect(files.filter((file) => !file.endsWith('.css'))).toEqual(['auth.json', 'theme.json']);
});

test('createBuildWatchIgnore ignores build files nothing imports', () => {
  const ignore = createBuildWatchIgnore({ root });
  const build = (...parts) => path.join(root, 'build', ...parts);
  expect(ignore(build())).toBe(false);
  expect(ignore(path.join(root, 'client/App.jsx'))).toBe(false);
  expect(ignore(build('auth.json'))).toBe(false);
  expect(ignore(build('theme.json'))).toBe(false);
  expect(ignore(build('tailwind-candidates.css'))).toBe(false);
  expect(ignore(build('plugins'))).toBe(false);
  expect(ignore(build('plugins/operators/clientJsMap.js'))).toBe(false);
  expect(ignore(build('plugins/auth/strategies.js'))).toBe(false);
  expect(ignore(build('pages'))).toBe(true);
  expect(ignore(build('pages/p1/p1.json'))).toBe(true);
  expect(ignore(build('requests/p1/r.json'))).toBe(true);
  expect(ignore(build('api/e.json'))).toBe(true);
  expect(ignore(build('jitMaps/keyMap.json'))).toBe(true);
  expect(ignore(build('pageRegistry.json'))).toBe(true);
});
