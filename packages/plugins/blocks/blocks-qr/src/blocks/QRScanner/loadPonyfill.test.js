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

class BarcodeDetector {}
const prepareZXingModule = vi.fn();
const purgeZXingModule = vi.fn();

vi.doMock('barcode-detector/ponyfill', () => ({
  BarcodeDetector,
  prepareZXingModule,
  purgeZXingModule,
}));

test('loadPonyfill purges zxing and loads again on the next call after the .wasm fails', async () => {
  const { default: loadPonyfill } = await import('./loadPonyfill.js');
  prepareZXingModule.mockRejectedValueOnce(new Error('Failed to fetch'));
  await expect(loadPonyfill()).rejects.toThrow('Failed to fetch');
  expect(purgeZXingModule).toHaveBeenCalledTimes(1);

  prepareZXingModule.mockResolvedValueOnce({});
  await expect(loadPonyfill()).resolves.toBe(BarcodeDetector);
  expect(prepareZXingModule).toHaveBeenCalledTimes(2);
  expect(prepareZXingModule.mock.calls[1][0]).toMatchObject({ fireImmediately: true });

  // Loaded once, the detector is kept.
  await expect(loadPonyfill()).resolves.toBe(BarcodeDetector);
  expect(prepareZXingModule).toHaveBeenCalledTimes(2);
});
