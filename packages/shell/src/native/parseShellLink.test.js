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

import parseShellLink from './parseShellLink.js';

test('parseShellLink reads a shortcut link and the share extension link', () => {
  expect(parseShellLink('acme://shortcut/new-job')).toEqual({ kind: 'shortcut', id: 'new-job' });
  expect(parseShellLink('acme://expo-sharing')).toEqual({ kind: 'share' });
  expect(parseShellLink('acme://expo-sharing?x=1')).toEqual({ kind: 'share' });
});

test('parseShellLink leaves page links and other apps to the router', () => {
  expect(parseShellLink('acme://tasks/42')).toBe(null);
  expect(parseShellLink('https://field.example.com/tasks/42')).toBe(null);
  expect(parseShellLink(null)).toBe(null);
});
