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

const MESSAGES = {
  'client.copy': 'Copy',
  'client.copyValue': 'Copy: {value}',
  'client.copied': 'Copied',
  'client.copyFailed': 'Copy failed',
};

function Icon({ properties }) {
  return <svg data-testid={`icon-${properties.name}`} />;
}

const registration = {
  createHref: ({ pathname }) => pathname,
  getLocale: () => 'en-US',
  HtmlOverlay: () => null,
  Icon,
  icons: { check: () => null, copy: () => null },
  link: () => undefined,
  translate: (key, values) => MESSAGES[key].replace('{value}', values?.value ?? ''),
};

beforeEach(() => {
  registerHtmlEnhancements(registration);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  registerHtmlEnhancements(null);
  console.warn.mockRestore();
});

function formatted(html) {
  const { container } = render(<HtmlComponent html={html} />);
  return container.querySelector('[data-format]').textContent;
}

test('data-format formats numbers like the grid number cells', () => {
  expect(formatted('<span data-format>1234.5</span>')).toBe('1,234.5');
  expect(formatted('<span data-format="number" data-decimals="2">1234.5</span>')).toBe('1,234.50');
  expect(formatted('<span data-format="percent" data-decimals="1">0.123</span>')).toBe('12.3%');
  expect(formatted('<span data-format="compact">1500</span>')).toBe('1.5K');
  expect(formatted('<span data-format="currency" data-currency="eur">-1234.5</span>')).toBe(
    '-€1,234.50'
  );
  expect(formatted('<span data-format="bytes"> 1536 </span>')).toBe('1.5 kB');
});

test('currency needs a three-letter data-currency', () => {
  expect(formatted('<span data-format="currency">12</span>')).toBe('12');
  expect(formatted('<span data-format="currency" data-currency="RANDS">12</span>')).toBe('12');
  expect(console.warn).toHaveBeenCalledWith(
    'data-format="currency" needs data-currency with a three-letter currency code, so "12" was left as it is.'
  );
});

test('text that is not decimal is left as it is', () => {
  ['0x1A', 'Infinity', '1,234', 'abc'].forEach((text) => {
    expect(formatted(`<span data-format>${text}</span>`)).toBe(text);
  });
  expect(formatted('<span data-format></span>')).toBe('');
  expect(formatted('<span data-format>1e3</span>')).toBe('1,000');
});

test('an unknown format or bad decimals are reported, never thrown', () => {
  expect(formatted('<span data-format="money">12</span>')).toBe('12');
  expect(formatted('<span data-format data-decimals="-1">1.25</span>')).toBe('1.25');
  expect(console.warn).toHaveBeenCalledWith(
    'data-format="money" is not a number format, so the text was left as it is.'
  );
  expect(console.warn).toHaveBeenCalledWith(
    'data-decimals="-1" is not a whole number from 0 to 20, so it was ignored.'
  );
});
