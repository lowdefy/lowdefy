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

import { cell, htmlToText, isBlank, styleValue, toCellValue, toPoints } from '../report.js';

describe('isBlank', () => {
  test('isBlank is true for null, undefined, and the empty string only', () => {
    expect(isBlank(null)).toBe(true);
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank('')).toBe(true);
    expect(isBlank(0)).toBe(false);
    expect(isBlank(false)).toBe(false);
    expect(isBlank(' ')).toBe(false);
  });
});

describe('toCellValue', () => {
  test('toCellValue passes primitives and dates through unchanged', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    expect(toCellValue('a')).toBe('a');
    expect(toCellValue(1.5)).toBe(1.5);
    expect(toCellValue(true)).toBe(true);
    expect(toCellValue(null)).toBe(null);
    expect(toCellValue(undefined)).toBe(undefined);
    expect(toCellValue(date)).toBe(date);
  });

  test('toCellValue serialises objects and arrays so a formula-shaped object is text', () => {
    expect(toCellValue({ formula: 'HYPERLINK("x")' })).toBe('{"formula":"HYPERLINK(\\"x\\")"}');
    expect(toCellValue([1, 2])).toBe('[1,2]');
  });

  test('toCellValue drops functions', () => {
    expect(toCellValue(() => 1)).toBe(undefined);
  });
});

describe('cell', () => {
  test('cell omits formatted when no display string is given', () => {
    expect(cell(3)).toEqual({ value: 3 });
  });

  test('cell coerces the value and stringifies the display string', () => {
    expect(cell({ a: 1 }, 42)).toEqual({ value: '{"a":1}', formatted: '42' });
  });
});

describe('styleValue', () => {
  test('styleValue prefers element, then block, then a flat style', () => {
    expect(styleValue({ element: { height: 1 }, block: { height: 2 }, height: 3 }, 'height')).toBe(
      1
    );
    expect(styleValue({ block: { height: 2 }, height: 3 }, 'height')).toBe(2);
    expect(styleValue({ height: 3 }, 'height')).toBe(3);
  });

  test('styleValue returns undefined for a missing key or a non-object style', () => {
    expect(styleValue({ height: 3 }, 'width')).toBe(undefined);
    expect(styleValue('height: 3', 'height')).toBe(undefined);
    expect(styleValue(undefined, 'height')).toBe(undefined);
  });
});

describe('toPoints', () => {
  test('toPoints reads numbers and numeric strings', () => {
    expect(toPoints(300)).toBe(300);
    expect(toPoints('300px')).toBe(300);
    expect(toPoints('12.5')).toBe(12.5);
  });

  test('toPoints returns undefined for non-numeric input', () => {
    expect(toPoints('auto')).toBe(undefined);
    expect(toPoints(Number.NaN)).toBe(undefined);
    expect(toPoints(null)).toBe(undefined);
    expect(toPoints({})).toBe(undefined);
  });
});

describe('htmlToText', () => {
  test('htmlToText leaves plain text untouched', () => {
    expect(htmlToText('Total revenue')).toBe('Total revenue');
  });

  test('htmlToText strips tags and turns line-ending tags into newlines', () => {
    expect(htmlToText('<b>Bold</b> and <i>italic</i>')).toBe('Bold and italic');
    expect(htmlToText('<p>One</p><p>Two</p>')).toBe('One\nTwo');
    expect(htmlToText('Line<br/>Break')).toBe('Line\nBreak');
  });

  test('htmlToText decodes named and numeric entities', () => {
    expect(htmlToText('Fish &amp; Chips &lt;3 &#169; &#x41;')).toBe('Fish & Chips <3 © A');
  });

  test('htmlToText stringifies non-string input', () => {
    expect(htmlToText(42)).toBe('42');
  });
});
