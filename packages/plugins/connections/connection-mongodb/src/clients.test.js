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

import { expect, test } from 'vitest';

import { closeClients } from './clients.js';
import { closeClients as closeCachedClients } from './connections/MongoDBCollection/getClient.js';

test('the clients entry exports the closeClients that closes the cached driver clients', () => {
  expect(closeClients).toBe(closeCachedClients);
});

test('the package exports map serves the clients entry', () => {
  const packageJson = JSON.parse(
    fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );
  expect(packageJson.exports['./clients']).toEqual('./dist/clients.js');
});
