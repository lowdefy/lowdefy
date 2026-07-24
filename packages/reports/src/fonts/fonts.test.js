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

import fonts, { fonts as namedFonts, FONT_FAMILY } from './fonts.js';

// TrueType files begin with the version tag 0x00010000.
const TTF_MAGIC = '00010000';

test('FONT_FAMILY is Roboto', () => {
  expect(FONT_FAMILY).toBe('Roboto');
});

test('default export is the fonts object', () => {
  expect(fonts).toBe(namedFonts);
});

test('exposes exactly the four document faces', () => {
  expect(Object.keys(fonts).sort()).toEqual(['bold', 'boldItalic', 'italic', 'regular']);
});

test.each(['regular', 'bold', 'italic', 'boldItalic'])(
  '%s face is a non-trivial TrueType Buffer',
  (face) => {
    const buffer = fonts[face];
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString('hex')).toBe(TTF_MAGIC);
  }
);

test('decodes each face once (stable buffer identity across reads)', () => {
  expect(fonts.regular).toBe(namedFonts.regular);
});
