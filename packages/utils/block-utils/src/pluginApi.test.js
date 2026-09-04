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
import { fileURLToPath } from 'url';

import { PLUGIN_API_VERSION, REMOVED_BLOCK_METHODS } from './pluginApi.js';

const pluginsDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../plugins'
);

test('PLUGIN_API_VERSION is a positive integer', () => {
  expect(Number.isInteger(PLUGIN_API_VERSION)).toBe(true);
  expect(PLUGIN_API_VERSION).toBeGreaterThanOrEqual(1);
});

test('REMOVED_BLOCK_METHODS.makeCssClass names the classNames replacement', () => {
  expect(typeof REMOVED_BLOCK_METHODS.makeCssClass).toBe('string');
  expect(REMOVED_BLOCK_METHODS.makeCssClass).toContain('classNames');
  expect(REMOVED_BLOCK_METHODS.makeCssClass).toContain('styles');
});

test('REMOVED_BLOCK_METHODS only maps method names to replacement text', () => {
  Object.entries(REMOVED_BLOCK_METHODS).forEach(([name, replacement]) => {
    expect(name).toMatch(/^[a-zA-Z_$][\w$]*$/);
    expect(typeof replacement).toBe('string');
    expect(replacement.length).toBeGreaterThan(0);
  });
});

// A plugin package that declares nothing is only a build warning for one release, so nothing else
// would catch a first-party package that never got the field.
test('every first-party plugin package declares the current plugin API version', () => {
  const declared = {};
  for (const kind of fs.readdirSync(pluginsDirectory)) {
    const kindDirectory = path.join(pluginsDirectory, kind);
    if (!fs.statSync(kindDirectory).isDirectory()) continue;
    for (const name of fs.readdirSync(kindDirectory)) {
      const filePath = path.join(kindDirectory, name, 'package.json');
      if (!fs.existsSync(filePath)) continue;
      const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      declared[packageJson.name] = packageJson.lowdefy?.pluginApiVersion;
    }
  }
  expect(Object.keys(declared).length).toBeGreaterThan(20);
  for (const [name, version] of Object.entries(declared)) {
    expect([name, version]).toEqual([name, PLUGIN_API_VERSION]);
  }
});
