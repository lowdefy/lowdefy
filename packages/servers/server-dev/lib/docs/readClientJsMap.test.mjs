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
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.doMock('../server/log/createLogger.js', () => ({ default: () => ({ error: vi.fn() }) }));

const { default: readClientJsMap } = await import('./readClientJsMap.js');

let buildDirectory;

function writeMap(text) {
  const filePath = path.join(buildDirectory, 'plugins', 'operators', 'clientJsMap.js');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
}

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-client-js-map-'));
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

// A lowdefy.yaml edit rebuilds the config with no restart and rewrites the client map, with the
// app events' _js the import cached at the first journey never held.
test('readClientJsMap reads the client map as the file is now, again once it changes', () => {
  writeMap("export default { 'h_app': () => { return 'first'; } };");
  const first = readClientJsMap({ buildDirectory, fallback: {} });
  expect(first.h_app()).toBe('first');
  expect(readClientJsMap({ buildDirectory, fallback: {} })).toBe(first);
  writeMap("export default { 'h_app_edited': () => { return 'edited'; } };");
  const edited = readClientJsMap({ buildDirectory, fallback: {} });
  expect(Object.keys(edited)).toEqual(['h_app_edited']);
  expect(edited.h_app_edited()).toBe('edited');
});

test('readClientJsMap keeps the last good map while the file does not evaluate', () => {
  writeMap("export default { 'h_app': () => { return 'first'; } };");
  const first = readClientJsMap({ buildDirectory, fallback: {} });
  writeMap("export default { 'h_app': () => { return 'fir");
  expect(readClientJsMap({ buildDirectory, fallback: {} })).toBe(first);
});

test('readClientJsMap answers the imported map when the file was never read', () => {
  const fallback = { h_imported: () => 1 };
  expect(readClientJsMap({ buildDirectory, fallback })).toBe(fallback);
});
