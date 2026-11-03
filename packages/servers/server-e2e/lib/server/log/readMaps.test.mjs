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
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

import { loadAndResolveErrorLocation } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';
import { vi, afterEach, beforeEach, expect, test } from 'vitest';

// Key maps in both entry shapes: builds before the short shape wrote full
// entries, and journeys scope can read either. The short map covers an entry
// that inherits its parent's ref, one that names its own, one with r: null
// under a parent that has a ref, one with no line, and a module ref with no
// path of its own (resolved through its parent ref's file).
const shortKeyMap = {
  k1: { s: 'root', p: 'k0', r: 'ref_0', l: 1 },
  k2: { s: '.pages', p: 'k1', l: 3 },
  k3: { s: '[0:home]', p: 'k2', r: 'ref_1', l: 1 },
  k4: { s: '.blocks', p: 'k3', l: 4 },
  k5: { s: '[0:header]', p: 'k4', l: 5 },
  k6: { s: '.events', p: 'k5' },
  k7: { s: '[1:footer]', p: 'k4', r: 'ref_2', l: 9 },
  k8: { s: '.properties', p: 'k7', r: null, l: 2 },
  k9: { s: '[2:module]', p: 'k4', r: 'ref_3', l: 12, i: ['state-refs'] },
};
const fullKeyMap = {
  f1: { key: 'root', '~k_parent': 'f0', '~r': 'ref_0', '~l': 1 },
  f2: { key: 'root.pages[0:home]', '~k_parent': 'f1', '~r': 'ref_1', '~l': 1 },
  f3: { key: 'root.pages[0:home].blocks[0:header]', '~k_parent': 'f2', '~r': 'ref_1', '~l': 5 },
  f4: { key: 'root.pages[0:home].events', '~k_parent': 'f2', '~r': 'ref_1' },
  f5: { key: 'root.menus', '~k_parent': 'f1' },
  f6: { key: 'root.pages[0:home].blocks[2:module]', '~k_parent': 'f2', '~r': 'ref_3', '~l': 12 },
};
const refMap = {
  ref_0: { path: 'lowdefy.yaml' },
  ref_1: { path: 'pages/home.yaml', parent: 'ref_0' },
  ref_2: { path: 'pages/footer.yaml', parent: 'ref_1', original: { '~arr': [{ a: 1 }] } },
  ref_3: { parent: 'ref_1' },
};

let buildDirectory;
let readMaps;
let logger;

function writeMaps({ keyMap, gzip = true }) {
  const keyMapJson = JSON.stringify(keyMap);
  const refMapJson = JSON.stringify(refMap);
  fs.writeFileSync(path.join(buildDirectory, 'keyMap.json'), keyMapJson);
  fs.writeFileSync(path.join(buildDirectory, 'refMap.json'), refMapJson);
  if (gzip) {
    fs.writeFileSync(path.join(buildDirectory, 'keyMap.json.gz'), zlib.gzipSync(keyMapJson));
    fs.writeFileSync(path.join(buildDirectory, 'refMap.json.gz'), zlib.gzipSync(refMapJson));
  }
}

// What the servers read before: keyMap.json and refMap.json through
// readConfigFile, which deserializes them with the serializer.
async function readConfigFile(filePath) {
  const content = await fsPromises.readFile(path.join(buildDirectory, filePath), 'utf8');
  return serializer.deserializeFromString(content);
}

beforeEach(async () => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-read-maps-'));
  logger = { warn: vi.fn() };
  vi.resetModules();
  ({ default: readMaps } = await import('./readMaps.js'));
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('readMaps returns the same maps as JSON.parse of the plain files', async () => {
  writeMaps({ keyMap: shortKeyMap });

  const maps = await readMaps({ buildDirectory, logger });

  expect(maps).toEqual({
    keyMap: JSON.parse(fs.readFileSync(path.join(buildDirectory, 'keyMap.json'), 'utf8')),
    refMap: JSON.parse(fs.readFileSync(path.join(buildDirectory, 'refMap.json'), 'utf8')),
  });
});

test('readMaps reads no file on a second call', async () => {
  writeMaps({ keyMap: shortKeyMap });
  const readFile = vi.spyOn(fsPromises, 'readFile');

  const first = await readMaps({ buildDirectory, logger });
  expect(readFile).toHaveBeenCalledTimes(2);
  const second = await readMaps({ buildDirectory, logger });

  expect(readFile).toHaveBeenCalledTimes(2);
  expect(second).toBe(first);
});

test('readMaps calls made together before the first load resolves share one read and parse', async () => {
  writeMaps({ keyMap: shortKeyMap });
  const readFile = vi.spyOn(fsPromises, 'readFile');
  const parse = vi.spyOn(JSON, 'parse');

  const results = await Promise.all([
    readMaps({ buildDirectory, logger }),
    readMaps({ buildDirectory, logger }),
    readMaps({ buildDirectory, logger }),
  ]);

  const mapTexts = [JSON.stringify(shortKeyMap), JSON.stringify(refMap)];
  expect(readFile).toHaveBeenCalledTimes(2);
  expect(parse.mock.calls.filter(([text]) => mapTexts.includes(text))).toHaveLength(2);
  expect(results[1]).toBe(results[0]);
  expect(results[2]).toBe(results[0]);
});

test.each([['keyMap.json.gz'], ['refMap.json.gz']])(
  'readMaps without %s resolves to no maps and never reads the filesystem again',
  async (missingFile) => {
    writeMaps({ keyMap: shortKeyMap });
    fs.rmSync(path.join(buildDirectory, missingFile));
    const readFile = vi.spyOn(fsPromises, 'readFile');

    const first = readMaps({ buildDirectory, logger });
    expect(await first).toEqual({ keyMap: null, refMap: null });
    const readsForFirstCall = readFile.mock.calls.length;

    // Every later call gets the settled promise of the first, as a cached hit
    // does, so it resolves in one microtask with no filesystem call.
    const later = Array.from({ length: 100 }, () => readMaps({ buildDirectory, logger }));
    later.forEach((call) => expect(call).toBe(first));
    await Promise.all(later);

    expect(readFile).toHaveBeenCalledTimes(readsForFirstCall);
    expect(logger.warn).not.toHaveBeenCalled();
  }
);

test('readMaps without any maps never falls back to the plain files', async () => {
  writeMaps({ keyMap: shortKeyMap, gzip: false });
  const readFile = vi.spyOn(fsPromises, 'readFile');

  expect(await readMaps({ buildDirectory, logger })).toEqual({ keyMap: null, refMap: null });

  const filesRead = readFile.mock.calls.map(([filePath]) => path.basename(filePath));
  expect(filesRead.sort()).toEqual(['keyMap.json.gz', 'refMap.json.gz']);
});

test('readMaps reads a corrupt gzip again on the next call and warns once', async () => {
  writeMaps({ keyMap: shortKeyMap });
  fs.writeFileSync(path.join(buildDirectory, 'keyMap.json.gz'), 'not gzip');
  const readFile = vi.spyOn(fsPromises, 'readFile');

  expect(await readMaps({ buildDirectory, logger })).toEqual({ keyMap: null, refMap: null });
  expect(await readMaps({ buildDirectory, logger })).toEqual({ keyMap: null, refMap: null });

  expect(readFile).toHaveBeenCalledTimes(4);
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0].err.code).toEqual('Z_DATA_ERROR');
});

test('readMaps reads invalid JSON again on the next call, warns once, and loads once fixed', async () => {
  writeMaps({ keyMap: shortKeyMap });
  fs.writeFileSync(path.join(buildDirectory, 'refMap.json.gz'), zlib.gzipSync('{"ref_1":'));
  const readFile = vi.spyOn(fsPromises, 'readFile');

  expect(await readMaps({ buildDirectory, logger })).toEqual({ keyMap: null, refMap: null });
  expect(await readMaps({ buildDirectory, logger })).toEqual({ keyMap: null, refMap: null });
  expect(readFile).toHaveBeenCalledTimes(4);
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0].err).toBeInstanceOf(SyntaxError);

  fs.writeFileSync(
    path.join(buildDirectory, 'refMap.json.gz'),
    zlib.gzipSync(JSON.stringify(refMap))
  );
  const maps = await readMaps({ buildDirectory, logger });
  expect(maps.refMap).toEqual(refMap);
  expect(logger.warn).toHaveBeenCalledTimes(1);
});

test.each([
  ['short', shortKeyMap],
  ['full', fullKeyMap],
])(
  'every key of a %s-shape key map resolves to the same location from the gzipped maps as from the plain maps',
  async (_shape, keyMap) => {
    writeMaps({ keyMap });

    for (const configDirectory of [undefined, '/Users/dev/app']) {
      for (const configKey of Object.keys(keyMap)) {
        const error = { configKey };
        const plain = await loadAndResolveErrorLocation({
          error,
          readConfigFile,
          configDirectory,
        });
        const gzipped = await loadAndResolveErrorLocation({
          error,
          readConfigFile: () => {
            throw new Error('readConfigFile must not be called.');
          },
          configDirectory,
          readMaps: () => readMaps({ buildDirectory, logger }),
        });
        expect(plain).not.toBeNull();
        expect(gzipped).toEqual(plain);
      }
    }
  }
);

test('a key that is not in the maps resolves to no location from the gzipped maps', async () => {
  writeMaps({ keyMap: shortKeyMap });

  const location = await loadAndResolveErrorLocation({
    error: { configKey: 'k_missing' },
    configDirectory: undefined,
    readMaps: () => readMaps({ buildDirectory, logger }),
  });

  expect(location).toBeNull();
});
