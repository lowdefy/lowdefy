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

import isReportsPluginDeclared from './isReportsPluginDeclared.js';

test('returns false when no plugins are declared', () => {
  expect(isReportsPluginDeclared({ context: {} })).toBe(false);
  expect(isReportsPluginDeclared({ context: { plugins: [] } })).toBe(false);
});

test('returns false when other plugins are declared but not reports', () => {
  const context = { plugins: [{ name: '@lowdefy/plugin-csv', version: '5.4.0' }] };
  expect(isReportsPluginDeclared({ context })).toBe(false);
});

test('returns true when the reports plugin is declared', () => {
  const context = {
    plugins: [
      { name: '@lowdefy/plugin-csv', version: '5.4.0' },
      { name: '@lowdefy/plugin-reports', version: '5.4.0' },
    ],
  };
  expect(isReportsPluginDeclared({ context })).toBe(true);
});
