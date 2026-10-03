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

import { cachedPromises, serializer } from '@lowdefy/helpers';

import createMutantReadConfigFile from './createMutantReadConfigFile.js';
import { journeyActorToken } from '../auth/journeyActor.js';
import { openMutantRun, readMutantRun } from './mutantRuns.js';
import { pageFixture } from './test/fixtures.mjs';

const ARTIFACT = 'pages/tickets.json';

// As the API context reads a build artifact: through cachedPromises, so every
// request shares one parsed object per path while the cache holds it.
function createCachedReadConfigFile(files) {
  const store = new Map();
  const cache = { get: (key) => store.get(key), set: (key, value) => store.set(key, value) };
  return cachedPromises({
    cache,
    getter: async (filePath) => serializer.deserializeFromString(files[filePath] ?? 'null'),
  });
}

function setup(mutantOverrides = {}) {
  const { root } = pageFixture();
  const success = root.slots.content.blocks[3].slots.content.blocks[0];
  const files = {
    [ARTIFACT]: serializer.serializeToString(root),
    'events.json': serializer.serializeToString({ onInit: { try: [], catch: [] } }),
  };
  const readConfigFile = createCachedReadConfigFile(files);
  const opened = openMutantRun({
    mutant: {
      buildId: 'build-1',
      artifact: ARTIFACT,
      key: success['~k'],
      arg: null,
      operator: 'drop-block',
      ...mutantOverrides,
    },
  });
  return { opened, readConfigFile, root };
}

function mutantCookie(payload, token = journeyActorToken) {
  return `session=abc; lowdefy_journey_mutant=${token}.${payload}`;
}

test('a read of the target path returns the mutated copy and counts one application', async () => {
  const { opened, readConfigFile } = setup();
  const read = createMutantReadConfigFile({ readConfigFile, run: opened.run });
  const page = await read(ARTIFACT);
  expect(page.slots.content.blocks[3].slots.content.blocks).toEqual([]);
  expect(opened.run.applied).toBe(1);
  expect(opened.run.misses).toEqual([]);
  opened.close();
});

test('a read of another path is untouched', async () => {
  const { opened, readConfigFile } = setup();
  const read = createMutantReadConfigFile({ readConfigFile, run: opened.run });
  expect(await read('events.json')).toBe(await readConfigFile('events.json'));
  expect(opened.run.applied).toBe(0);
  opened.close();
});

test('a mutated read followed by an unmutated read through a shared cache returns the original', async () => {
  const { opened, readConfigFile } = setup();
  const mutated = await createMutantReadConfigFile({ readConfigFile, run: opened.run })(ARTIFACT);
  const original = await readConfigFile(ARTIFACT);
  expect(mutated.slots.content.blocks[3].slots.content.blocks).toHaveLength(0);
  expect(original.slots.content.blocks[3].slots.content.blocks).toHaveLength(1);
  // The copy keeps ~k, so the mutant can still be found in it.
  expect(mutated.slots.content.blocks[0]['~k']).toEqual(original.slots.content.blocks[0]['~k']);
  opened.close();
});

test('a key not found and an apply with no arg each record a miss and apply nothing', async () => {
  const missingKey = setup({ key: 'not-a-key' });
  const page = await createMutantReadConfigFile({
    readConfigFile: missingKey.readConfigFile,
    run: missingKey.opened.run,
  })(ARTIFACT);
  expect(missingKey.opened.run.applied).toBe(0);
  expect(missingKey.opened.run.misses).toEqual([{ reason: 'key not found', path: ARTIFACT }]);
  expect(JSON.stringify(page)).toEqual(JSON.stringify(missingKey.root));
  missingKey.opened.close();

  const name = missingKey.root.slots.content.blocks[1];
  const noArg = setup({ operator: 'flip-visible', key: name['~k'], arg: null });
  await createMutantReadConfigFile({ readConfigFile: noArg.readConfigFile, run: noArg.opened.run })(
    ARTIFACT
  );
  expect(noArg.opened.run.applied).toBe(0);
  expect(noArg.opened.run.misses).toEqual([
    { reason: 'flip-visible needs arg visible or properties.disabled', path: ARTIFACT },
  ]);
  noArg.opened.close();
});

test('readMutantRun returns the open run a verified mutant cookie names', () => {
  const { opened } = setup();
  expect(readMutantRun(mutantCookie(opened.cookiePayload))).toBe(opened.run);
  opened.close();
});

test('readMutantRun returns null for a forged token, a missing cookie and a closed run', () => {
  const { opened } = setup();
  expect(readMutantRun(mutantCookie(opened.cookiePayload, '0'.repeat(64)))).toBeNull();
  expect(readMutantRun('session=abc')).toBeNull();
  expect(readMutantRun(undefined)).toBeNull();
  opened.close();
  expect(readMutantRun(mutantCookie(opened.cookiePayload))).toBeNull();
});

test('openMutantRun gives every run its own 16-byte id', () => {
  const first = setup().opened;
  const second = setup().opened;
  expect(first.id).toMatch(/^[0-9a-f]{32}$/);
  expect(first.id).not.toEqual(second.id);
  first.close();
  second.close();
});
