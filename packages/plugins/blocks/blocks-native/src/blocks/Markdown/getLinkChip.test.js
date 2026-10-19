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

const taskChips = [
  { pattern: '^/ACME/tasks/(?<key>ACME-\\d+)$', icon: 'CircleCheck', tone: 'info' },
];

test('getLinkChip matches an app path by pattern, its key the named group', () => {
  expect(
    getLinkChip({
      href: '/ACME/tasks/ACME-647',
      linkChips: taskChips,
      text: 'ACME-647 (Fix broken menu URL)',
    })
  ).toEqual({ chip: taskChips[0], key: 'ACME-647', title: 'Fix broken menu URL' });
});

test('getLinkChip takes a pattern chip title after a separator or in brackets', () => {
  const chip = (text) => getLinkChip({ href: '/ACME/tasks/ACME-1', linkChips: taskChips, text });
  expect(chip('ACME-1 - Fix the menu').title).toEqual('Fix the menu');
  expect(chip('ACME-1: Fix the menu').title).toEqual('Fix the menu');
  expect(chip('ACME-1 — Fix the menu').title).toEqual('Fix the menu');
  expect(chip('ACME-1').title).toBeNull();
});

test('getLinkChip keeps the key of a pattern chip when the link text is only its title', () => {
  expect(
    getLinkChip({ href: '/ACME/tasks/ACME-647', linkChips: taskChips, text: 'Fix broken menu URL' })
  ).toEqual({ chip: taskChips[0], key: 'ACME-647', title: 'Fix broken menu URL' });
  expect(getLinkChip({ href: '/ACME/tasks/ACME-647', linkChips: taskChips, text: '' })).toEqual({
    chip: taskChips[0],
    key: 'ACME-647',
    title: null,
  });
});

test('getLinkChip takes the first numbered group when a pattern names no key group', () => {
  const linkChips = [{ pattern: '^/ACME/designs/(ACME-\\d+)$' }];
  expect(getLinkChip({ href: '/ACME/designs/ACME-9', linkChips, text: 'ACME-9 Payroll' })).toEqual({
    chip: linkChips[0],
    key: 'ACME-9',
    title: 'Payroll',
  });
});

test('getLinkChip draws the link text as the key for a pattern with no group', () => {
  const linkChips = [{ pattern: '^/ACME/people/', prefix: '@' }];
  expect(getLinkChip({ href: '/ACME/people/u_1', linkChips, text: 'Ada' })).toEqual({
    chip: linkChips[0],
    key: '@Ada',
    title: null,
  });
});

test('getLinkChip shows the key alone, or the link text, by the chip label', () => {
  const href = '/ACME/tasks/ACME-647';
  const text = 'ACME-647 (Fix broken menu URL)';
  const keyChips = [{ ...taskChips[0], label: 'key' }];
  expect(getLinkChip({ href, linkChips: keyChips, text })).toEqual({
    chip: keyChips[0],
    key: 'ACME-647',
    title: null,
  });
  const textChips = [{ ...taskChips[0], label: 'text' }];
  expect(getLinkChip({ href, linkChips: textChips, text })).toEqual({
    chip: textChips[0],
    key: 'ACME-647 (Fix broken menu URL)',
    title: null,
  });
  expect(
    getLinkChip({
      href: 'pelican:PEL-12',
      linkChips: [{ scheme: 'pelican', label: 'key' }],
      text: 'PEL-12 Sign in',
    }).title
  ).toBeNull();
});

test('getLinkChip draws the first chip a link matches, and a path no pattern finds as a plain link', () => {
  const linkChips = [{ scheme: 'pelican' }, ...taskChips, { pattern: '^/ACME/', tone: 'neutral' }];
  expect(getLinkChip({ href: '/ACME/tasks/ACME-3', linkChips, text: 'ACME-3' }).chip).toBe(
    linkChips[1]
  );
  expect(getLinkChip({ href: '/ACME/home', linkChips, text: 'Home' }).chip).toBe(linkChips[2]);
  expect(
    getLinkChip({ href: '/OTHER/tasks/ACME-3', linkChips: taskChips, text: 'ACME-3' })
  ).toBeNull();
  expect(
    getLinkChip({ href: 'https://example.com/ACME/tasks/ACME-3', linkChips: taskChips, text: 'x' })
  ).toBeNull();
});
