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

import toAppLinkPath from './toAppLinkPath.js';

test('toAppLinkPath turns a link to the app into its page path and query', () => {
  expect(
    toAppLinkPath({
      appUrl: 'https://field.example.com/acme',
      path: 'https://field.example.com/acme/tasks/42?tab=notes',
    })
  ).toBe('/tasks/42?tab=notes');
  expect(
    toAppLinkPath({ appUrl: 'https://field.example.com', path: 'https://field.example.com' })
  ).toBe('/');
});

test('toAppLinkPath leaves other links alone', () => {
  expect(
    toAppLinkPath({ appUrl: 'https://field.example.com', path: 'https://other.example.com/x' })
  ).toBe('https://other.example.com/x');
  expect(toAppLinkPath({ appUrl: 'https://field.example.com', path: 'acme://tasks/1' })).toBe(
    'acme://tasks/1'
  );
});
