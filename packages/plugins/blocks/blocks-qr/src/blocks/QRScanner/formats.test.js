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

import { expect, test } from 'vitest';

import toDetectorFormats from './toDetectorFormats.js';
import toScanType from './toScanType.js';
import typeFormats from './typeFormats.js';

test('toDetectorFormats asks for every code type but the zxing-only ones when types is not set', () => {
  const formats = toDetectorFormats({});
  expect(formats).toHaveLength(Object.keys(typeFormats).length - 3);
  expect(formats).toContain('qr_code');
  expect(formats).toContain('codabar');
  expect(formats).not.toContain('databar');
  expect(formats).not.toContain('databar_expanded');
  expect(formats).not.toContain('maxi_code');
});

test('toDetectorFormats maps the block types to BarcodeDetector formats', () => {
  expect(toDetectorFormats({ types: ['qr', 'ean13', 'itf14', 'datamatrix', 'maxicode'] })).toEqual([
    'qr_code',
    'ean_13',
    'itf',
    'data_matrix',
    'maxi_code',
  ]);
});

test('toDetectorFormats throws naming the value when types is an empty list', () => {
  expect(() => toDetectorFormats({ types: [] })).toThrow(
    'QRScanner property "types" should be a list of code types. Received [].'
  );
});

test('toDetectorFormats throws naming the type when types has an unknown code type', () => {
  expect(() => toDetectorFormats({ types: ['qr', 'QR_CODE'] })).toThrow(
    'QRScanner property "types" has an unknown code type "QR_CODE".'
  );
});

test('toScanType maps a reported format back to its block type, specific names included', () => {
  expect(toScanType({ format: 'qr_code' })).toBe('qr');
  expect(toScanType({ format: 'qr_code_model_2' })).toBe('qr');
  expect(toScanType({ format: 'databar_omni' })).toBe('databar');
  expect(toScanType({ format: 'itf_14' })).toBe('itf14');
  expect(toScanType({ format: 'upc_a' })).toBe('upc_a');
});

test('toScanType passes a format the block has no type for through unchanged', () => {
  expect(toScanType({ format: 'telepen' })).toBe('telepen');
});

test('every block type in meta has a format, and every format belongs to one type', async () => {
  const { default: meta } = await import('./meta.js');
  expect(meta.properties.properties.types.items.enum.toSorted()).toEqual(
    Object.keys(typeFormats).toSorted()
  );
  const formats = Object.values(typeFormats).flat();
  expect(new Set(formats).size).toBe(formats.length);
});
