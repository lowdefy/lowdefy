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

import { jest } from '@jest/globals';

import getAvatarColor from './getAvatarColor.js';
import theme from '../../test/theme.json';

const { dark, light } = theme;

test('getAvatarColor gives a name the same hue every time, whatever its case or spacing', () => {
  const first = getAvatarColor({ isDark: false, name: 'Ada Lovelace', tokens: light });
  expect(getAvatarColor({ isDark: false, name: 'Ada Lovelace', tokens: light })).toEqual(first);
  expect(getAvatarColor({ isDark: false, name: ' ada lovelace ', tokens: light })).toEqual(first);
});

test('getAvatarColor keeps the hue across modes and draws it with the theme of the mode', () => {
  const lightColor = getAvatarColor({ isDark: false, name: 'Sam Tolmay', tokens: light });
  const darkColor = getAvatarColor({ isDark: true, name: 'Sam Tolmay', tokens: dark });
  expect(darkColor.hue).toEqual(lightColor.hue);
  expect(darkColor.color).toEqual(dark[`${darkColor.hue}-6`]);
});

test('getAvatarColor spreads names over the palette', () => {
  const names = ['Ada', 'Grace', 'Linus', 'Margaret', 'Alan', 'Barbara', 'Dennis', 'Edsger'];
  const hues = new Set(
    names.map((name) => getAvatarColor({ isDark: false, name, tokens: light }).hue)
  );
  expect(hues.size).toBeGreaterThanOrEqual(4);
  expect(hues.has('red')).toBe(false);
});

test('getAvatarColor draws bright hues a shade deeper in light mode', () => {
  const names = Array.from({ length: 60 }, (value, index) => `Person ${index}`);
  const bright = names
    .map((name) => getAvatarColor({ isDark: false, name, tokens: light }))
    .find(({ hue }) => hue === 'gold');
  expect(bright.color).toEqual(light['gold-7']);
});

test('getAvatarColor uses a configured colour, and the neutral fill for no name', () => {
  expect(getAvatarColor({ color: 'teal', isDark: false, name: 'Ada', tokens: light })).toEqual({
    hue: null,
    color: light['cyan-6'],
  });
  expect(getAvatarColor({ isDark: false, name: '', tokens: light })).toEqual({
    hue: null,
    color: light.colorFill,
  });
});

test('getAvatarColor gives a name the same hue whatever the device locale', () => {
  const name = 'IGOR IVANOV';
  const expected = getAvatarColor({ isDark: false, name, tokens: light });
  expect(getAvatarColor({ isDark: false, name: 'igor ivanov', tokens: light })).toEqual(expected);
  // A Turkish locale lower-cases "I" to a dotless "ı".
  const turkish = jest
    .spyOn(String.prototype, 'toLocaleLowerCase')
    .mockImplementation(function toTurkishLowerCase() {
      return this.replace(/I/g, 'ı').toLowerCase();
    });
  try {
    expect(getAvatarColor({ isDark: false, name, tokens: light })).toEqual(expected);
  } finally {
    turkish.mockRestore();
  }
});
