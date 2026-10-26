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

import getNavigationTheme from './getNavigationTheme.js';

const tokens = {
  colorError: '#ff4d4f',
  colorGroupedBackground: '#F2F2F7',
  colorLabel: '#000000',
  colorSeparator: 'rgba(60,60,67,0.29)',
  colorTint: '#6366f1',
};

test('getNavigationTheme draws the navigators in the app tint, surfaces and label colour', () => {
  const base = { dark: false, colors: {}, fonts: { regular: { fontFamily: 'System' } } };
  expect(getNavigationTheme({ base, isDark: true, tokens })).toEqual({
    dark: true,
    colors: {
      primary: '#6366f1',
      background: '#F2F2F7',
      card: '#F2F2F7',
      text: '#000000',
      border: 'rgba(60,60,67,0.29)',
      notification: '#ff4d4f',
    },
    fonts: base.fonts,
  });
});
