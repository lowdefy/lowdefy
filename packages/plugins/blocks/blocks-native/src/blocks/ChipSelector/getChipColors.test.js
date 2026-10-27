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

import { iosColors } from '@lowdefy/client-native';

import getChipColors from './getChipColors.js';
import theme from '../../test/theme.json';

const light = { ...iosColors.light, ...theme.light, colorTint: theme.light.colorPrimary };
const dark = { ...iosColors.dark, ...theme.dark, colorTint: theme.dark.colorPrimary };

const blue = { fg: '#0A6BC9', bg: '#E2EDF9', fgDark: '#85B5E4', bgDark: '#1E3B59' };

test('getChipColors draws a mark fg on bg, and flips the tile of a selected chip', () => {
  expect(getChipColors({ color: blue, isDark: false, tokens: light })).toEqual({
    accent: '#0A6BC9',
    tint: '#E2EDF9',
    tile: { background: '#E2EDF9', foreground: '#0A6BC9' },
    selectedTile: { background: '#0A6BC9', foreground: '#E2EDF9' },
  });
});

test('getChipColors takes the dark variants of a mark in dark mode', () => {
  expect(getChipColors({ color: blue, isDark: true, tokens: dark })).toMatchObject({
    accent: '#85B5E4',
    tint: '#1E3B59',
    tile: { background: '#1E3B59', foreground: '#85B5E4' },
  });
});

test('getChipColors tints a mark without bg, and never uses the light bg in dark mode', () => {
  expect(getChipColors({ color: { fg: '#0A6BC9' }, isDark: false, tokens: light }).tint).toEqual(
    'rgba(10,107,201,0.15)'
  );
  const darkMark = getChipColors({
    color: { fg: '#0A6BC9', bg: '#E2EDF9' },
    isDark: true,
    tokens: dark,
  });
  expect(darkMark).toMatchObject({ accent: '#0A6BC9', tint: 'rgba(10,107,201,0.24)' });
});

test('getChipColors draws a palette hue or hex as a tile with a white icon on a soft tint', () => {
  const hue = getChipColors({ color: 'blue', isDark: false, tokens: light });
  expect(hue).toEqual({
    accent: light['blue-6'],
    tint: expect.stringMatching(/^rgba\(.*,0\.15\)$/),
    tile: { background: light['blue-6'], foreground: '#FFFFFF' },
    selectedTile: { background: light['blue-6'], foreground: '#FFFFFF' },
  });
  expect(getChipColors({ color: '#C22E2E', isDark: true, tokens: dark })).toMatchObject({
    accent: '#C22E2E',
    tint: 'rgba(194,46,46,0.24)',
  });
});

test('getChipColors uses the tint without a colour, and a neutral fill for a colour it cannot tint', () => {
  expect(getChipColors({ isDark: false, tokens: light })).toMatchObject({
    accent: light.colorTint,
    tile: { background: light.colorTint, foreground: '#FFFFFF' },
  });
  expect(getChipColors({ color: 'rgb(10, 20, 30)', isDark: false, tokens: light })).toMatchObject({
    accent: 'rgb(10, 20, 30)',
    tint: light.colorTertiarySystemFill,
  });
});
