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

test('createDetector uses the native detector when it reads every requested format', async () => {
  const { default: createDetector } = await import('./createDetector.js');
  const detector = await createDetector({
    formats: ['qr_code', 'ean_13'],
    nativeDetector: createNativeDetector(['qr_code', 'ean_13', 'code_128']),
  });
  expect(detector).toMatchObject({ kind: 'native', options: { formats: ['qr_code', 'ean_13'] } });
});

test('createDetector uses the ponyfill when the native detector lacks a requested format', async () => {
  const { default: createDetector } = await import('./createDetector.js');
  const detector = await createDetector({
    formats: ['qr_code', 'codabar'],
    nativeDetector: createNativeDetector(['qr_code']),
  });
  expect(detector).toMatchObject({
    kind: 'ponyfill',
    options: { formats: ['qr_code', 'codabar'] },
  });
});

test('createDetector uses the ponyfill when the browser has no BarcodeDetector', async () => {
  const { default: createDetector } = await import('./createDetector.js');
  const detector = await createDetector({ formats: ['qr_code'], nativeDetector: undefined });
  expect(detector.kind).toBe('ponyfill');
});
