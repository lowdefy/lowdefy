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

import applyMailFilter from './applyMailFilter.js';

const mail = {
  to: 'a@allowed.com',
  cc: 'c@other.com',
  bcc: 'd@allowed.com',
  subject: 'Subject',
  text: 'Text',
};

test('applyMailFilter returns mail unchanged when filter is undefined', () => {
  expect(applyMailFilter({ filter: undefined, mail })).toEqual(mail);
});

test('applyMailFilter returns mail unchanged when filter is null', () => {
  expect(applyMailFilter({ filter: null, mail })).toEqual(mail);
});

test('applyMailFilter returns mail unchanged when all filter properties are none', () => {
  expect(
    applyMailFilter({ filter: { replaceAddress: null, allowlist: null, regex: null }, mail })
  ).toEqual(mail);
  expect(applyMailFilter({ filter: {}, mail })).toEqual(mail);
});

test('applyMailFilter replaceAddress replaces to and drops cc and bcc', () => {
  expect(applyMailFilter({ filter: { replaceAddress: 'dev@example.com' }, mail })).toEqual({
    to: 'dev@example.com',
    cc: undefined,
    bcc: undefined,
    subject: 'Subject',
    text: 'Text',
  });
});

test('applyMailFilter replaceAddress short-circuits allowlist and regex', () => {
  expect(
    applyMailFilter({
      filter: { replaceAddress: 'dev@example.com', allowlist: ['nomatch.com'], regex: '^nomatch' },
      mail,
    })
  ).toEqual({
    to: 'dev@example.com',
    cc: undefined,
    bcc: undefined,
    subject: 'Subject',
    text: 'Text',
  });
});

test('applyMailFilter allowlist keeps recipients with allowed domains', () => {
  const result = applyMailFilter({
    filter: { allowlist: ['allowed.com'] },
    mail: {
      to: ['a@allowed.com', 'b@other.com'],
      cc: ['c@other.com', 'e@allowed.com'],
      bcc: ['f@other.com'],
      subject: 'Subject',
    },
  });
  expect(result).toEqual({
    to: ['a@allowed.com'],
    cc: ['e@allowed.com'],
    bcc: undefined,
    subject: 'Subject',
  });
});

test('applyMailFilter allowlist matches domains case-insensitively', () => {
  const result = applyMailFilter({
    filter: { allowlist: ['Allowed.COM'] },
    mail: { to: ['A@ALLOWED.com', 'b@other.com'] },
  });
  expect(result).toEqual({ to: ['A@ALLOWED.com'], cc: undefined, bcc: undefined });
});

test('applyMailFilter allowlist matches "Name <address>" strings on the bare address', () => {
  const result = applyMailFilter({
    filter: { allowlist: ['allowed.com'] },
    mail: { to: ['Name One <a@Allowed.com>', 'Name Two <b@other.com>'] },
  });
  expect(result).toEqual({ to: ['Name One <a@Allowed.com>'], cc: undefined, bcc: undefined });
});

test('applyMailFilter allowlist matches { name, email } recipients on email', () => {
  const result = applyMailFilter({
    filter: { allowlist: ['allowed.com'] },
    mail: {
      to: [
        { name: 'Name One', email: 'a@Allowed.com' },
        { name: 'Name Two', email: 'b@other.com' },
      ],
    },
  });
  expect(result).toEqual({
    to: [{ name: 'Name One', email: 'a@Allowed.com' }],
    cc: undefined,
    bcc: undefined,
  });
});

test('applyMailFilter preserves single recipient shape when it survives', () => {
  const result = applyMailFilter({
    filter: { allowlist: ['allowed.com'] },
    mail: { to: 'a@allowed.com', cc: 'c@allowed.com' },
  });
  expect(result).toEqual({ to: 'a@allowed.com', cc: 'c@allowed.com', bcc: undefined });
});

test('applyMailFilter regex keeps only matching addresses', () => {
  const result = applyMailFilter({
    filter: { regex: '^dev\\+' },
    mail: { to: ['dev+one@x.com', 'other@x.com'], cc: 'dev+two@x.com' },
  });
  expect(result).toEqual({ to: ['dev+one@x.com'], cc: 'dev+two@x.com', bcc: undefined });
});

test('applyMailFilter allowlist and regex apply as AND predicates', () => {
  const result = applyMailFilter({
    filter: { allowlist: ['allowed.com'], regex: '^dev' },
    mail: { to: ['dev@allowed.com', 'dev@other.com', 'nodev@allowed.com'] },
  });
  expect(result).toEqual({ to: ['dev@allowed.com'], cc: undefined, bcc: undefined });
});

test('applyMailFilter returns null when no to recipients survive', () => {
  expect(
    applyMailFilter({
      filter: { allowlist: ['allowed.com'] },
      mail: { to: 'a@other.com', cc: 'c@allowed.com' },
    })
  ).toBe(null);
  expect(
    applyMailFilter({
      filter: { allowlist: ['allowed.com'] },
      mail: { to: ['a@other.com', 'b@other.com'] },
    })
  ).toBe(null);
});

test('applyMailFilter sets emptied cc and bcc to undefined', () => {
  const result = applyMailFilter({
    filter: { allowlist: ['allowed.com'] },
    mail: { to: 'a@allowed.com', cc: ['c@other.com'], bcc: 'd@other.com' },
  });
  expect(result).toEqual({ to: 'a@allowed.com', cc: undefined, bcc: undefined });
  expect(result.cc).toBe(undefined);
  expect(result.bcc).toBe(undefined);
});

test('applyMailFilter leaves undefined cc and bcc undefined', () => {
  const result = applyMailFilter({
    filter: { allowlist: ['allowed.com'] },
    mail: { to: 'a@allowed.com' },
  });
  expect(result).toEqual({ to: 'a@allowed.com', cc: undefined, bcc: undefined });
});
