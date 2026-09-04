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

const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-ops-source-'));
fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
const writeArtifact = (name, data) =>
  fs.writeFileSync(path.join(fixtureDir, 'build', name), JSON.stringify(data));
writeArtifact('keyMap.json', {
  'key-a': { key: 'root.pages[0:orders].requests[0:get_orders]', '~r': 'ref-orders', '~l': 12 },
});
writeArtifact('refMap.json', { 'ref-orders': { parent: null, path: 'pages/orders.yaml' } });
writeArtifact('appMeta.json', { gitSha: 'sha-build' });
process.chdir(fixtureDir);
process.env.LOWDEFY_DIRECTORY_CONFIG = fixtureDir;

const { default: createResolveEventSource } = await import('./createResolveEventSource.js');

test('createResolveEventSource resolves config_key to file:line when the git_sha matches the build', () => {
  const resolveEventSource = createResolveEventSource();
  expect(resolveEventSource({ configKey: 'key-a', gitSha: 'sha-build' })).toEqual({
    source: path.join(fixtureDir, 'pages/orders.yaml:12'),
    config: 'root.pages[0:orders].requests[0:get_orders]',
    config_key: 'key-a',
  });
});

test('createResolveEventSource keeps the raw config_key and says why when the git_sha differs', () => {
  const result = createResolveEventSource()({ configKey: 'key-a', gitSha: 'sha-deployed' });
  expect(result.source).toBeNull();
  expect(result.config_key).toBe('key-a');
  expect(result.note).toContain('sha-deployed');
  expect(result.note).toContain('sha-build');
});

test('createResolveEventSource reports a config_key the matching build does not hold', () => {
  const result = createResolveEventSource()({ configKey: 'key-missing', gitSha: 'sha-build' });
  expect(result.source).toBeNull();
  expect(result.config_key).toBe('key-missing');
  expect(result.note).toContain('not in this build keyMap');
});

test('createResolveEventSource returns nulls for an event with no config_key', () => {
  expect(createResolveEventSource()({ configKey: null, gitSha: 'sha-build' })).toEqual({
    source: null,
    config_key: null,
  });
});
