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
import lineClampStyle from './lineClampStyle.js';
import customTagTone from './customTagTone.js';
import resolveTagTone from './resolveTagTone.js';
import seededTagColor from './seededTagColor.js';
import tagStyle from './tagStyle.js';
import TAG_TONES from './tagTones.js';
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

test('resolveTagTone maps tone names to their tokens and derives a tone for other colours', () => {
  expect(resolveTagTone('green')).toBe(TAG_TONES.green);
  expect(resolveTagTone('success')).toBe(TAG_TONES.success);
  expect(resolveTagTone(undefined)).toBe(TAG_TONES.default);
  expect(resolveTagTone('#ff0000')).toEqual(customTagTone('#ff0000'));
  // An inherited object key is a colour value, not a tone name.
  expect(resolveTagTone('constructor')).toEqual(customTagTone('constructor'));
});

test('preset tones follow antd Tag: -1 fill, -3 border, -7 text taken toward the text colour', () => {
  expect(TAG_TONES.gold).toEqual({
    color: 'var(--ant-gold-6, #faad14)',
    text: 'color-mix(in oklab, var(--ant-gold-7, #d48806) 70%, var(--ant-color-text-base, #000))',
    bg: 'var(--ant-gold-1, #fffbe6)',
    border: 'var(--ant-gold-3, #ffe58f)',
  });
});

test('status tones use antd status tokens, processing as info', () => {
  expect(TAG_TONES.processing).toEqual({
    color: 'var(--ant-color-info)',
    text: 'color-mix(in oklab, var(--ant-color-info-text) 60%, var(--ant-color-text-base, #000))',
    bg: 'var(--ant-color-info-bg)',
    border: 'var(--ant-color-info-border)',
  });
});

test('customTagTone tints the fill and border and darkens the text toward the text colour', () => {
  expect(customTagTone('var(--x)')).toEqual({
    color: 'var(--x)',
    text: 'color-mix(in oklab, var(--x) 60%, var(--ant-color-text-base, #000))',
    bg: 'color-mix(in srgb, var(--x) 12%, transparent)',
    border: 'color-mix(in srgb, var(--x) 30%, transparent)',
  });
});

test('TONE_COLORS is the colour of every tone', () => {
  expect(TONE_COLORS.success).toBe('var(--ant-color-success)');
  expect(TONE_COLORS.processing).toBe('var(--ant-color-info)');
  expect(TONE_COLORS.red).toBe('var(--ant-red-6, #f5222d)');
  expect(Object.keys(TONE_COLORS)).toEqual(Object.keys(TAG_TONES));
});

test('tagStyle draws the tone text, fill and border', () => {
  const style = tagStyle({ text: 'var(--t)', bg: 'var(--b)', border: 'var(--o)' });
  expect(style.color).toBe('var(--t)');
  expect(style.background).toBe('var(--b)');
  expect(style.border).toBe('1px solid var(--o)');
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

test('lineClampStyle clamps to the given number of lines', () => {
  expect(lineClampStyle(3)).toEqual({
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 3,
    overflow: 'hidden',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  });
});
