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

test('applyMailFilter drops .invalid recipients from to, cc and bcc with no filter', () => {
  const result = applyMailFilter({
    filter: undefined,
    mail: {
      to: ['x@audit.invalid', 'a@real.com'],
      cc: ['c@smoke.invalid', 'c@real.com'],
      bcc: ['b@audit.invalid'],
    },
  });
  expect(result).toEqual({ to: ['a@real.com'], cc: ['c@real.com'], bcc: undefined });
});

test('applyMailFilter drops .invalid recipients case-insensitively in every address form', () => {
  const result = applyMailFilter({
    filter: null,
    mail: {
      to: [
        'X@Audit.INVALID',
        'Test User <x@AUDIT.INVALID>',
        { name: 'Test User', email: 'y@smoke.invalid' },
        'user@invalid',
        'Real <real@real.com>',
      ],
    },
  });
  expect(result).toEqual({ to: ['Real <real@real.com>'], cc: undefined, bcc: undefined });
});

test('applyMailFilter keeps example.com and .test recipients with no filter', () => {
  const mail = { to: ['ada@example.com', 'ada@example.test', 'b@invalid.org'] };
  expect(applyMailFilter({ filter: null, mail })).toEqual(mail);
});

test('applyMailFilter keeps a comma-separated address string whole when an address in it is not on .invalid', () => {
  const mail = { to: 'Test <x@audit.invalid>, a@real.com' };
  expect(applyMailFilter({ filter: null, mail })).toEqual(mail);
});

test('applyMailFilter returns null for a comma-separated string of .invalid addresses before replaceAddress redirects', () => {
  expect(
    applyMailFilter({
      filter: { replaceAddress: 'catchall@real.com' },
      mail: { to: 'a@audit.invalid, b@audit.invalid' },
    })
  ).toBe(null);
});

test('applyMailFilter drops .invalid addresses with surrounding spaces or a trailing dot', () => {
  const result = applyMailFilter({
    filter: null,
    mail: { to: ['x@audit.invalid ', 'x@audit.invalid.', '<x@audit.invalid >', 'a@real.com'] },
  });
  expect(result).toEqual({ to: ['a@real.com'], cc: undefined, bcc: undefined });
});

test('applyMailFilter sends each cc and bcc recipient a copy when every to recipient is on .invalid with no filter', () => {
  const result = applyMailFilter({
    filter: undefined,
    mail: {
      to: ['x@audit.invalid', 'y@smoke.invalid'],
      cc: 'c@real.com',
      bcc: ['b@audit.invalid', 'b@real.com'],
    },
  });
  expect(result).toEqual({
    to: ['c@real.com', 'b@real.com'],
    cc: undefined,
    bcc: undefined,
    isMultiple: true,
  });
});

test('applyMailFilter returns null when every to, cc and bcc recipient is on .invalid', () => {
  expect(
    applyMailFilter({
      filter: undefined,
      mail: { to: ['x@audit.invalid'], cc: 'c@audit.invalid', bcc: ['b@smoke.invalid'] },
    })
  ).toBe(null);
});

test('applyMailFilter leaves recipients of an unexpected shape for SendGrid to reject', () => {
  const mail = { to: ['a@real.com', null, { name: 'No Email' }] };
  expect(applyMailFilter({ filter: null, mail })).toEqual(mail);
});

test('applyMailFilter returns null for an .invalid to before replaceAddress redirects', () => {
  expect(
    applyMailFilter({
      filter: { replaceAddress: 'catchall@real.com' },
      mail: { to: 'x@audit.invalid' },
    })
  ).toBe(null);
});

test('applyMailFilter replaceAddress redirects when a to recipient survives the .invalid drop', () => {
  expect(
    applyMailFilter({
      filter: { replaceAddress: 'catchall@real.com' },
      mail: { to: ['x@audit.invalid', 'y@real.com'], subject: 'A' },
    })
  ).toEqual({ to: 'catchall@real.com', cc: undefined, bcc: undefined, subject: 'A' });
});

test('applyMailFilter drops .invalid recipients before the allowlist runs', () => {
  expect(
    applyMailFilter({
      filter: { allowlist: ['real.com', 'smoke.invalid'] },
      mail: { to: ['x@smoke.invalid', 'a@real.com'], cc: 'c@smoke.invalid' },
    })
  ).toEqual({ to: ['a@real.com'], cc: undefined, bcc: undefined });
});

// Each input took quadratic time with the regex the code used before: seconds at this length,
// against a few milliseconds now. Jest cannot time out synchronous code, so the time is checked.
const LONG = 200000;

function timed(fn) {
  const start = performance.now();
  const result = fn();
  return { result, ms: performance.now() - start };
}

test('applyMailFilter keeps a long recipient with no "@" without stalling', () => {
  const to = '!'.repeat(LONG);
  const { result, ms } = timed(() => applyMailFilter({ filter: null, mail: { to } }));
  expect(result).toEqual({ to, cc: undefined, bcc: undefined });
  expect(ms).toBeLessThan(1000);
});

test('applyMailFilter keeps an address on a domain of many dots without stalling', () => {
  const to = `a@${'.'.repeat(LONG)}x`;
  const { result, ms } = timed(() => applyMailFilter({ filter: null, mail: { to } }));
  expect(result).toEqual({ to, cc: undefined, bcc: undefined });
  expect(ms).toBeLessThan(1000);
});

test('applyMailFilter allowlist reads a long run of "<" without stalling', () => {
  const to = `${'<'.repeat(LONG)}a@allowed.com`;
  const { result, ms } = timed(() =>
    applyMailFilter({ filter: { allowlist: ['allowed.com'] }, mail: { to } })
  );
  expect(result).toEqual({ to, cc: undefined, bcc: undefined });
  expect(ms).toBeLessThan(1000);
});

test('applyMailFilter allowlist reads the innermost "<address>" of nested angle brackets', () => {
  const result = applyMailFilter({
    filter: { allowlist: ['allowed.com'] },
    mail: { to: 'Name <<a@allowed.com>' },
  });
  expect(result).toEqual({ to: 'Name <<a@allowed.com>', cc: undefined, bcc: undefined });
});

test('applyMailFilter does not read a string with "@" only at an edge as an address', () => {
  const result = applyMailFilter({
    filter: null,
    mail: { to: ['@audit.invalid', 'audit.invalid@'] },
  });
  expect(result).toEqual({
    to: ['@audit.invalid', 'audit.invalid@'],
    cc: undefined,
    bcc: undefined,
  });
});
