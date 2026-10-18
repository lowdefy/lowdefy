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

import getBackgroundTint from './getBackgroundTint.js';

const tokens = { colorPrimary: '#6366f1', 'blue-6': '#1677ff' };

test('getBackgroundTint is null for a Screen with no backgroundTint', () => {
  expect(getBackgroundTint({ backgroundTint: undefined, isDark: false, tokens })).toBeNull();
  expect(getBackgroundTint({ backgroundTint: null, isDark: true, tokens })).toBeNull();
});

test('getBackgroundTint draws the colour at 35% in light mode, fading out at 15% of the screen', () => {
  expect(
    getBackgroundTint({ backgroundTint: { color: '#ff7a45' }, isDark: false, tokens })
  ).toEqual({ color: '#ff7a45', height: 0.15, opacity: 0.35 });
});

test('getBackgroundTint draws colorDark at 45% in dark mode', () => {
  expect(
    getBackgroundTint({
      backgroundTint: { color: '#ff7a45', colorDark: '#d4380d', height: 0.3 },
      isDark: true,
      tokens,
    })
  ).toEqual({ color: '#d4380d', height: 0.3, opacity: 0.45 });
});

test('getBackgroundTint draws color in dark mode when there is no colorDark', () => {
  expect(getBackgroundTint({ backgroundTint: { color: '#ff7a45' }, isDark: true, tokens })).toEqual(
    { color: '#ff7a45', height: 0.15, opacity: 0.45 }
  );
});

test('getBackgroundTint reads a theme token or a palette hue as the colour of the mode showing', () => {
  expect(
    getBackgroundTint({ backgroundTint: { color: 'colorPrimary' }, isDark: false, tokens }).color
  ).toBe('#6366f1');
  expect(
    getBackgroundTint({ backgroundTint: { color: 'blue' }, isDark: false, tokens }).color
  ).toBe('#1677ff');
  expect(
    getBackgroundTint({ backgroundTint: { color: 'rgb(1, 2, 3)' }, isDark: false, tokens }).color
  ).toBe('rgb(1, 2, 3)');
});

test('getBackgroundTint keeps a height of 0', () => {
  expect(
    getBackgroundTint({ backgroundTint: { color: '#000', height: 0 }, isDark: false, tokens })
      .height
  ).toBe(0);
});
