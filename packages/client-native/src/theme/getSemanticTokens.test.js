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

import getSemanticTokens from './getSemanticTokens.js';

const light = { colorPrimary: '#6366f1', colorText: 'rgba(0,0,0,0.88)' };
const dark = { colorPrimary: '#575ad0', colorText: 'rgba(255,255,255,0.85)' };

test('getSemanticTokens adds the iOS grouped surfaces and label tiers of the mode', () => {
  expect(getSemanticTokens({ isDark: false, tokens: light })).toMatchObject({
    colorCell: '#FFFFFF',
    colorGroupedBackground: '#F2F2F7',
    colorLabel: '#000000',
    colorSecondaryLabel: 'rgba(60,60,67,0.6)',
    colorSeparator: 'rgba(60,60,67,0.29)',
    colorText: light.colorText,
  });
  expect(getSemanticTokens({ isDark: true, tokens: dark })).toMatchObject({
    colorCell: '#1C1C1E',
    colorGroupedBackground: '#000000',
    colorLabel: '#FFFFFF',
    colorSecondaryLabel: 'rgba(235,235,245,0.6)',
  });
});

test('getSemanticTokens takes the tint from the mode colorPrimary', () => {
  expect(getSemanticTokens({ isDark: false, tokens: light })).toMatchObject({
    colorTint: '#6366f1',
    colorTintFill: 'rgba(99,102,241,0.14)',
  });
  expect(getSemanticTokens({ isDark: true, tokens: dark })).toMatchObject({
    colorTint: '#575ad0',
    colorTintFill: 'rgba(87,90,208,0.24)',
  });
});

test('getSemanticTokens keeps a semantic token the app theme sets', () => {
  const tokens = { ...light, colorGroupedBackground: '#FAFAFA', colorTint: '#FF0000' };
  expect(getSemanticTokens({ isDark: false, tokens })).toMatchObject({
    colorGroupedBackground: '#FAFAFA',
    colorTint: '#FF0000',
  });
});
