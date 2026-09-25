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

import React from 'react';
import { jest } from '@jest/globals';
import { render } from '@testing-library/react';

import HtmlComponent from '../HtmlComponent.js';
import registerHtmlEnhancements from '../registerHtmlEnhancements.js';
import seededTagColor from '../format/seededTagColor.js';
import TONE_COLORS from '../format/toneColors.js';

// jsdom has no CSS.supports; this stands in for the browser's colour parser.
const supports = jest.fn((property, value) => /^rgb\(\d+ \d+ \d+\)$/.test(value));

beforeAll(() => {
  window.CSS = { supports };
});

beforeEach(() => {
  registerHtmlEnhancements({ HtmlOverlay: () => null, Icon: () => null, icons: {} });
});

afterEach(() => {
  registerHtmlEnhancements(null);
});

function tone(html) {
  const { container } = render(<HtmlComponent html={html} />);
  return container.querySelector('[data-tag], [data-status]').style.getPropertyValue('--lf-tone');
}

test('preset tones are left to the stylesheet', () => {
  expect(tone('<span data-tag="success">Approved</span>')).toBe('');
  expect(tone('<span data-tag="orange">On hold</span>')).toBe('');
  expect(tone('<span data-status="processing">Syncing</span>')).toBe('');
});

test('a tone name in another case gets its token inline', () => {
  expect(tone('<span data-tag="Success">Approved</span>')).toBe(TONE_COLORS.success);
});

test('explicit colour syntax becomes the tone', () => {
  expect(tone('<span data-tag="#1677ff">Custom</span>')).toBe('#1677ff');
  expect(tone('<span data-tag="rgb(22 119 255)">Custom</span>')).toBe('rgb(22 119 255)');
  expect(tone('<span data-status="var(--ant-color-primary)">x</span>')).toBe(
    'var(--ant-color-primary)'
  );
});

test('named colours, invalid functions and url( values are seeds, never colours', () => {
  ['White', 'navy', 'transparent', 'rgb(nope)', 'var(--x, url(http://example.com/a.png))'].forEach(
    (value) => {
      expect(tone(`<span data-tag="${value}">x</span>`)).toBe(TONE_COLORS[seededTagColor(value)]);
    }
  );
});

test('an inherited object key is a seed, not a tone', () => {
  expect(tone('<span data-tag="constructor">x</span>')).toBe(
    TONE_COLORS[seededTagColor('constructor')]
  );
});

test('any other value seeds the colour, and a bare attribute seeds from the text', () => {
  expect(tone('<span data-tag="category-7">Books</span>')).toBe(
    TONE_COLORS[seededTagColor('category-7')]
  );
  expect(tone('<span data-tag> Books </span>')).toBe(TONE_COLORS[seededTagColor('Books')]);
});

test('HTML tags seed the same colour as grid tag cells for the same text', () => {
  // TagCell seeds with seededTagColor(value) and resolves the name through the tag table.
  expect(tone('<span data-tag>Approved</span>')).toBe(TONE_COLORS[seededTagColor('Approved')]);
});

test('tones are not applied without a registration', () => {
  registerHtmlEnhancements(null);
  const { container } = render(<HtmlComponent html="<span data-tag>Books</span>" />);
  expect(container.firstChild.hasAttribute('data-lf-html')).toBe(false);
  expect(container.querySelector('[data-tag]').style.getPropertyValue('--lf-tone')).toBe('');
});
