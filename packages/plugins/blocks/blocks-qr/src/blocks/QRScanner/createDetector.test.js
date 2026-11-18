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

import { expect, test, vi } from 'vitest';

class PonyfillDetector {
  constructor(options) {
    this.kind = 'ponyfill';
    this.options = options;
  }
}

vi.doMock('./loadPonyfill.js', () => ({ default: async () => PonyfillDetector }));

// The formats Chrome on macOS reads (Apple's Vision framework): no codabar or upc_a.
const MACOS_FORMATS = [
  'aztec',
  'code_128',
  'code_39',
  'code_93',
  'data_matrix',
  'ean_13',
  'ean_8',
  'itf',
  'pdf417',
  'qr_code',
  'upc_e',
];

function createNativeDetector(supported) {
  return class NativeDetector {
    static async getSupportedFormats() {
      return supported;
    }
    constructor(options) {
      this.kind = 'native';
      this.options = options;
    }
  };
}

test('createDetector uses the native detector when it reads every requested type', async () => {
  const { default: createDetector } = await import('./createDetector.js');
  const detector = await createDetector({
    types: ['qr', 'ean13'],
    nativeDetector: createNativeDetector(MACOS_FORMATS),
  });
  expect(detector).toMatchObject({ kind: 'native', options: { formats: ['qr_code', 'ean_13'] } });
});

test('createDetector uses the ponyfill when the native detector lacks a requested type', async () => {
  const { default: createDetector } = await import('./createDetector.js');
  const detector = await createDetector({
    types: ['qr', 'codabar'],
    nativeDetector: createNativeDetector(MACOS_FORMATS),
  });
  expect(detector).toMatchObject({
    kind: 'ponyfill',
    options: { formats: ['qr_code', 'codabar'] },
  });
});

test('createDetector uses the native detector with the default types it reads when types is not set', async () => {
  const { default: createDetector } = await import('./createDetector.js');
  const detector = await createDetector({ nativeDetector: createNativeDetector(MACOS_FORMATS) });
  expect(detector.kind).toBe('native');
  expect(detector.options.formats.toSorted()).toEqual(MACOS_FORMATS.toSorted());
});

test('createDetector uses the ponyfill when the native detector reads no format', async () => {
  const { default: createDetector } = await import('./createDetector.js');
  const detector = await createDetector({ nativeDetector: createNativeDetector([]) });
  expect(detector.kind).toBe('ponyfill');
  expect(detector.options.formats).toContain('codabar');
  expect(detector.options.formats).not.toContain('databar');
});

test('createDetector uses the ponyfill when the browser has no BarcodeDetector', async () => {
  const { default: createDetector } = await import('./createDetector.js');
  const detector = await createDetector({ types: ['qr'], nativeDetector: undefined });
  expect(detector).toMatchObject({ kind: 'ponyfill', options: { formats: ['qr_code'] } });
});
