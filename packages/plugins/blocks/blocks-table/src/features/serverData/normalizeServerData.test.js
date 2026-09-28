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

import normalizeServerData from './normalizeServerData.js';

test('normalizeServerData returns null for client rows', () => {
  expect(normalizeServerData([{ id: 1 }])).toBeNull();
  expect(normalizeServerData(undefined)).toBeNull();
});

test('normalizeServerData defaults the block size and cache size', () => {
  expect(normalizeServerData({ mode: 'server', request: 'deals' })).toEqual({
    request: 'deals',
    blockSize: 200,
    maxBlocks: 20,
  });
});

test('normalizeServerData throws for a missing request or a bad block size', () => {
  expect(() => normalizeServerData({ mode: 'server' })).toThrow('requires "request"');
  expect(() => normalizeServerData({ mode: 'client', request: 'x' })).toThrow(
    'must be a list of rows or { mode: server, request }'
  );
  expect(() => normalizeServerData({ mode: 'server', request: 'x', blockSize: 0 })).toThrow(
    '"data.blockSize" must be a positive integer'
  );
});
