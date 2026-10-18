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

import resolveColorSchemeOverride from './resolveColorSchemeOverride.js';

test('resolveColorSchemeOverride takes a mode fixed by config over the preference', () => {
  expect(resolveColorSchemeOverride({ configDarkMode: 'dark', preference: 'light' })).toBe('dark');
  expect(resolveColorSchemeOverride({ configDarkMode: 'light', preference: 'dark' })).toBe('light');
});

test('resolveColorSchemeOverride takes the preference, or follows the device', () => {
  expect(resolveColorSchemeOverride({ configDarkMode: 'system', preference: 'dark' })).toBe('dark');
  expect(resolveColorSchemeOverride({ configDarkMode: 'system', preference: 'system' })).toBe(
    'unspecified'
  );
});
