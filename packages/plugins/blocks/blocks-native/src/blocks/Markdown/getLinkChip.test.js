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

import getLinkChip from './getLinkChip.js';

const linkChips = [
  { scheme: 'pelican', icon: 'FileText', tone: 'primary' },
  { scheme: 'mention', tone: 'primary', prefix: '@' },
];

test('getLinkChip splits a record link into its key and title', () => {
  expect(
    getLinkChip({ href: 'pelican:PEL-12', linkChips, text: 'PEL-12 Sign in with a passkey' })
  ).toEqual({ chip: linkChips[0], key: 'PEL-12', title: 'Sign in with a passkey' });
});

test('getLinkChip gives a record link with only its key no title', () => {
  expect(getLinkChip({ href: 'pelican:PEL-12', linkChips, text: 'PEL-12' })).toEqual({
    chip: linkChips[0],
    key: 'PEL-12',
    title: null,
  });
});

test('getLinkChip matches the key and the scheme in any case', () => {
  expect(getLinkChip({ href: 'Pelican:pel-12', linkChips, text: 'PEL-12 Title' })).toEqual({
    chip: linkChips[0],
    key: 'PEL-12',
    title: 'Title',
  });
});

test('getLinkChip keeps a mention whole, with its prefix once', () => {
  expect(getLinkChip({ href: 'mention:u_1', linkChips, text: '@Ada Lovelace' })).toEqual({
    chip: linkChips[1],
    key: '@Ada Lovelace',
    title: null,
  });
  expect(getLinkChip({ href: 'mention:u_1', linkChips, text: 'Ada' }).key).toEqual('@Ada');
});

test('getLinkChip returns null for a link with no chip scheme', () => {
  expect(getLinkChip({ href: 'https://example.com', linkChips, text: 'Example' })).toBeNull();
  expect(getLinkChip({ href: '/relative', linkChips, text: 'Relative' })).toBeNull();
  expect(getLinkChip({ href: 'pelican:PEL-1', text: 'PEL-1' })).toBeNull();
});
