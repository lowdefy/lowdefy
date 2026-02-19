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

import loadAndResolveErrorLocation from './loadAndResolveErrorLocation.js';

const keyMap = {
  abc123: {
    key: 'root.pages[0:home].blocks[0:header]',
    '~r': 'ref1',
    '~l': 5,
  },
};

const refMap = {
  ref1: { path: 'pages/home.yaml' },
};

function createReadConfigFile(files) {
  return async function readConfigFile(filePath) {
    return files[filePath] ?? null;
  };
}

// --- null/missing configKey ---

test('loadAndResolveErrorLocation returns null when error is null', async () => {
  const readConfigFile = createReadConfigFile({});
  const result = await loadAndResolveErrorLocation({
    error: null,
    readConfigFile,
    configDirectory: '/app',
  });
  expect(result).toBeNull();
});

test('loadAndResolveErrorLocation returns null when error is undefined', async () => {
  const readConfigFile = createReadConfigFile({});
  const result = await loadAndResolveErrorLocation({
    error: undefined,
    readConfigFile,
    configDirectory: '/app',
  });
  expect(result).toBeNull();
});

test('loadAndResolveErrorLocation returns null when error has no configKey', async () => {
  const readConfigFile = createReadConfigFile({});
  const result = await loadAndResolveErrorLocation({
    error: new Error('no key'),
    readConfigFile,
    configDirectory: '/app',
  });
  expect(result).toBeNull();
});

// --- successful resolution ---

test('loadAndResolveErrorLocation resolves location from keyMap and refMap', async () => {
  const readConfigFile = createReadConfigFile({
    'keyMap.json': keyMap,
    'refMap.json': refMap,
  });
  const error = new Error('test');
  error.configKey = 'abc123';

  const result = await loadAndResolveErrorLocation({
    error,
    readConfigFile,
    configDirectory: '/app',
  });
  expect(result).toEqual({
    source: '/app/pages/home.yaml:5',
    config: 'root.pages[0:home].blocks[0:header]',
  });
});

// --- configKey not found in keyMap ---

test('loadAndResolveErrorLocation returns null when configKey not in keyMap', async () => {
  const readConfigFile = createReadConfigFile({
    'keyMap.json': keyMap,
    'refMap.json': refMap,
  });
  const error = new Error('test');
  error.configKey = 'missing';

  const result = await loadAndResolveErrorLocation({
    error,
    readConfigFile,
    configDirectory: '/app',
  });
  expect(result).toBeNull();
});

// --- readConfigFile throws ---

test('loadAndResolveErrorLocation returns null when readConfigFile throws', async () => {
  const readConfigFile = async () => {
    throw new Error('file not found');
  };
  const error = new Error('test');
  error.configKey = 'abc123';

  const result = await loadAndResolveErrorLocation({
    error,
    readConfigFile,
    configDirectory: '/app',
  });
  expect(result).toBeNull();
});
