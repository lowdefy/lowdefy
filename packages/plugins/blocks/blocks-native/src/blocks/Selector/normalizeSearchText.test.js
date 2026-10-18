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

import normalizeSearchText from './normalizeSearchText.js';

test('normalizeSearchText drops case, accents and surrounding space', () => {
  expect(normalizeSearchText({ text: '  José Ñúñez ' })).toBe('jose nunez');
  expect(normalizeSearchText({ text: 'Zoë Ångström' })).toBe('zoe angstrom');
});

test('normalizeSearchText leaves plain text in lower case', () => {
  expect(normalizeSearchText({ text: 'Ada Lovelace' })).toBe('ada lovelace');
  expect(normalizeSearchText({ text: '' })).toBe('');
});
