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

import avatarColor from './avatarColor.js';
import formatBytes from './formatBytes.js';
import formatDate from './formatDate.js';
import formatNumber from './formatNumber.js';
import hashSeed from './hashSeed.js';
import initials from './initials.js';
import resolveTagColor from './resolveTagColor.js';
import seededTagColor from './seededTagColor.js';
import tagStyle from './tagStyle.js';
import TONE_COLORS from './toneColors.js';

test('hashSeed is stable and treats null and undefined as 0', () => {
  expect(hashSeed('Approved')).toBe(hashSeed('Approved'));
  expect(hashSeed('Approved')).not.toBe(hashSeed('Rejected'));
  expect(hashSeed(null)).toBe(0);
  expect(hashSeed(undefined)).toBe(0);
  expect(hashSeed(42)).toBe(hashSeed('42'));
});

test('seededTagColor picks a preset tag colour name from the value', () => {
  expect(Object.keys(TONE_COLORS)).toContain(seededTagColor('Approved'));
  expect(seededTagColor('Approved')).toBe(seededTagColor('Approved'));
});

test('resolveTagColor maps preset names to tokens and passes other values through', () => {
  expect(resolveTagColor('green')).toBe('var(--ant-color-success)');
  expect(resolveTagColor(undefined)).toBe('var(--ant-color-text-secondary)');
  expect(resolveTagColor('#ff0000')).toBe('#ff0000');
  // The grid table has no status names; they stay as written.
  expect(resolveTagColor('success')).toBe('success');
});

test('TONE_COLORS adds the antd status names to the tag colours', () => {
  expect(TONE_COLORS.success).toBe('var(--ant-color-success)');
  expect(TONE_COLORS.processing).toBe('var(--ant-color-info)');
  expect(TONE_COLORS.red).toBe('var(--ant-color-error)');
});

test('tagStyle tints the fill and border with the colour', () => {
  const style = tagStyle('var(--x)');
  expect(style.color).toBe('var(--x)');
  expect(style.background).toBe('color-mix(in srgb, var(--x) 12%, transparent)');
  expect(style.border).toBe('1px solid color-mix(in srgb, var(--x) 30%, transparent)');
});

test('initials takes the first letter of the first two words', () => {
  expect(initials('  jane  van der Merwe ')).toBe('JV');
  expect(initials('Cher')).toBe('C');
  expect(initials('')).toBe('');
  expect(initials(undefined)).toBe('');
});

test('avatarColor is a theme token picked from the seed', () => {
  expect(avatarColor('Jane Doe')).toMatch(/^var\(--ant-color-/);
  expect(avatarColor('Jane Doe')).toBe(avatarColor('Jane Doe'));
});

test('formatNumber formats with the shared number config', () => {
  expect(formatNumber({ value: 1234.5, config: { locale: 'en-US' } })).toBe('1,234.5');
  expect(
    formatNumber({
      value: 1234.5,
      config: { format: 'currency', currency: 'EUR', locale: 'en-US' },
    })
  ).toBe('€1,234.50');
  expect(
    formatNumber({ value: 0.123, config: { format: 'percent', decimals: 1, locale: 'en-US' } })
  ).toBe('12.3%');
  expect(formatNumber({ value: 1500, config: { format: 'compact', locale: 'en-US' } })).toBe(
    '1.5K'
  );
  expect(
    formatNumber({ value: -5, config: { negative: 'parentheses', prefix: '~', suffix: ' u' } })
  ).toBe('~(5) u');
  expect(formatNumber({ value: -5, config: undefined })).toBe('-5');
});

test('formatDate formats with a dayjs format, relative to now, or returns null', () => {
  expect(formatDate({ value: '2021-06-30T10:00:00', format: 'D MMM YYYY' })).toBe('30 Jun 2021');
  expect(formatDate({ value: new Date(Date.now() - 3 * 3600 * 1000), relative: true })).toBe(
    '3 hours ago'
  );
  expect(formatDate({ value: 'not a date', format: 'YYYY' })).toBeNull();
});

test('formatBytes picks the largest unit with base 1000', () => {
  expect(formatBytes({ value: 12, locale: 'en-US' })).toBe('12 bytes');
  expect(formatBytes({ value: 1536, locale: 'en-US' })).toBe('1.5 kB');
  expect(formatBytes({ value: 3250000, locale: 'en-US' })).toBe('3.3 MB');
  expect(formatBytes({ value: 2e18, locale: 'en-US' })).toBe('2,000 PB');
  expect(formatBytes({ value: 1536, decimals: 2, locale: 'en-US' })).toBe('1.54 kB');
  expect(formatBytes({ value: -2048, locale: 'en-US' })).toBe('-2 kB');
});
