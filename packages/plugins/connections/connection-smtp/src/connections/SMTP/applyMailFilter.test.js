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

test('applyMailFilter returns mail unchanged when filter is undefined', () => {
  const mail = {
    to: 'someone@example.com',
    cc: 'cc@example.com',
    subject: 'A',
    text: 'B',
  };
  expect(applyMailFilter({ filter: undefined, mail })).toEqual(mail);
});

test('applyMailFilter returns mail unchanged when filter is null', () => {
  const mail = {
    to: 'someone@example.com',
    subject: 'A',
  };
  expect(applyMailFilter({ filter: null, mail })).toEqual(mail);
});

test('applyMailFilter returns mail unchanged when all filter fields are null', () => {
  const mail = {
    to: ['someone@example.com', 'other@other.org'],
    cc: 'cc@example.com',
    bcc: 'bcc@example.com',
    subject: 'A',
  };
  const filter = {
    replaceAddress: null,
    allowlist: null,
    regex: null,
  };
  expect(applyMailFilter({ filter, mail })).toEqual(mail);
});

test('applyMailFilter replaceAddress redirects all mail to the catch-all address and drops cc and bcc', () => {
  const mail = {
    to: ['someone@example.com', 'other@other.org'],
    cc: 'cc@example.com',
    bcc: ['bcc@example.com'],
    subject: 'A',
    text: 'B',
  };
  const filter = {
    replaceAddress: 'catchall@example.com',
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: 'catchall@example.com',
    cc: undefined,
    bcc: undefined,
    subject: 'A',
    text: 'B',
  });
});

test('applyMailFilter replaceAddress short-circuits allowlist and regex', () => {
  const mail = {
    to: 'blocked@blocked.org',
    subject: 'A',
  };
  const filter = {
    replaceAddress: 'catchall@example.com',
    allowlist: ['example.com'],
    regex: 'nomatch',
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: 'catchall@example.com',
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter allowlist keeps entries with matching domains across to, cc and bcc', () => {
  const mail = {
    to: ['someone@example.com', 'other@blocked.org'],
    cc: ['cc@example.com', 'cc@blocked.org'],
    bcc: ['bcc@blocked.org', 'bcc@example.com'],
    subject: 'A',
  };
  const filter = {
    allowlist: ['example.com'],
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: ['someone@example.com'],
    cc: ['cc@example.com'],
    bcc: ['bcc@example.com'],
    subject: 'A',
  });
});

test('applyMailFilter allowlist matches case-insensitively', () => {
  const mail = {
    to: ['Someone@EXAMPLE.COM', 'other@blocked.org'],
    subject: 'A',
  };
  const filter = {
    allowlist: ['Example.Com'],
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: ['Someone@EXAMPLE.COM'],
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter allowlist supports name-address strings and name-email objects and preserves original entries', () => {
  const mail = {
    to: [
      'Some One <someone@example.com>',
      { name: 'Other One', email: 'other@example.com' },
      'Blocked <blocked@blocked.org>',
      { name: 'Also Blocked', email: 'also@blocked.org' },
    ],
    subject: 'A',
  };
  const filter = {
    allowlist: ['example.com'],
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: ['Some One <someone@example.com>', { name: 'Other One', email: 'other@example.com' }],
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter allowlist keeps a single string entry as an array', () => {
  const mail = {
    to: 'someone@example.com',
    subject: 'A',
  };
  const filter = {
    allowlist: ['example.com'],
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: ['someone@example.com'],
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter regex keeps entries matching the pattern against the bare lowercased email', () => {
  const mail = {
    to: ['Some One <Someone@example.com>', 'other@other.org'],
    subject: 'A',
  };
  const filter = {
    regex: '^someone@',
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: ['Some One <Someone@example.com>'],
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter applies allowlist and regex as AND predicates', () => {
  const mail = {
    to: ['someone@example.com', 'other@example.com', 'someone@blocked.org'],
    subject: 'A',
  };
  const filter = {
    allowlist: ['example.com'],
    regex: '^someone@',
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: ['someone@example.com'],
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter returns null when no to recipients survive', () => {
  const mail = {
    to: ['blocked@blocked.org'],
    cc: ['cc@example.com'],
    subject: 'A',
  };
  const filter = {
    allowlist: ['example.com'],
  };
  expect(applyMailFilter({ filter, mail })).toBe(null);
});

test('applyMailFilter returns null when mail has no to recipients and a filter is active', () => {
  const mail = {
    subject: 'A',
  };
  const filter = {
    allowlist: ['example.com'],
  };
  expect(applyMailFilter({ filter, mail })).toBe(null);
});

test('applyMailFilter sets emptied cc and bcc to undefined', () => {
  const mail = {
    to: ['someone@example.com'],
    cc: ['cc@blocked.org'],
    bcc: ['bcc@blocked.org'],
    subject: 'A',
  };
  const filter = {
    allowlist: ['example.com'],
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: ['someone@example.com'],
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter ignores null filter fields when another field is set', () => {
  const mail = {
    to: ['someone@example.com', 'other@blocked.org'],
    subject: 'A',
  };
  const filter = {
    replaceAddress: null,
    allowlist: ['example.com'],
    regex: null,
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: ['someone@example.com'],
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter drops .invalid recipients from to, cc and bcc with no filter', () => {
  const mail = {
    to: ['x@audit.invalid', 'someone@example.com'],
    cc: ['c@smoke.invalid', 'cc@example.com'],
    bcc: ['b@audit.invalid'],
    subject: 'A',
  };
  expect(applyMailFilter({ filter: undefined, mail })).toEqual({
    to: ['someone@example.com'],
    cc: ['cc@example.com'],
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter drops .invalid recipients case-insensitively in every address form', () => {
  const mail = {
    to: [
      'X@Audit.INVALID',
      'Test User <x@AUDIT.INVALID>',
      { name: 'Test User', email: 'y@smoke.invalid' },
      'user@invalid',
      'Real <real@example.com>',
    ],
    subject: 'A',
  };
  expect(applyMailFilter({ filter: null, mail })).toEqual({
    to: ['Real <real@example.com>'],
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter keeps example.com and .test recipients with no filter', () => {
  const mail = {
    to: ['ada@example.com', 'ada@example.test', 'b@invalid.org'],
    subject: 'A',
  };
  expect(applyMailFilter({ filter: null, mail })).toEqual(mail);
});

test('applyMailFilter drops only the .invalid addresses of a comma-separated address string', () => {
  const mail = {
    to: 'Test <x@audit.invalid>, boss@real.com',
    subject: 'A',
  };
  expect(applyMailFilter({ filter: false, mail })).toEqual({
    to: [{ name: '', address: 'boss@real.com' }],
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter keeps a comma-separated address string as written when no address in it is on .invalid', () => {
  const mail = {
    to: 'someone@example.com, "Doe, John" <john@example.com>',
    subject: 'A',
  };
  expect(applyMailFilter({ filter: null, mail })).toEqual(mail);
});

test('applyMailFilter returns null for a comma-separated string of .invalid addresses before replaceAddress redirects', () => {
  const mail = {
    to: 'a@audit.invalid, b@audit.invalid',
    subject: 'A',
  };
  const filter = {
    replaceAddress: 'catchall@example.com',
  };
  expect(applyMailFilter({ filter, mail })).toBe(null);
});

test('applyMailFilter drops .invalid addresses with surrounding spaces or a trailing dot', () => {
  const mail = {
    to: ['x@audit.invalid ', 'x@audit.invalid.', '<x@audit.invalid >', 'someone@example.com'],
    subject: 'A',
  };
  expect(applyMailFilter({ filter: null, mail })).toEqual({
    to: ['someone@example.com'],
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter still sends to cc and bcc when every to recipient is on .invalid with no filter', () => {
  const mail = {
    to: ['x@audit.invalid', 'y@smoke.invalid'],
    cc: 'cc@example.com',
    bcc: ['b@audit.invalid', 'bcc@example.com'],
    subject: 'A',
  };
  expect(applyMailFilter({ filter: undefined, mail })).toEqual({
    to: undefined,
    cc: 'cc@example.com',
    bcc: ['bcc@example.com'],
    subject: 'A',
  });
});

test('applyMailFilter returns null when every to, cc and bcc recipient is on .invalid', () => {
  const mail = {
    to: ['x@audit.invalid', 'y@smoke.invalid'],
    cc: 'c@audit.invalid',
    bcc: ['b@audit.invalid'],
    subject: 'A',
  };
  expect(applyMailFilter({ filter: undefined, mail })).toBe(null);
});

test('applyMailFilter allowlist checks each address of a comma-separated address string', () => {
  const mail = {
    to: 'someone@example.com, other@other.com',
    subject: 'A',
  };
  const filter = {
    allowlist: ['example.com'],
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: [{ name: '', address: 'someone@example.com' }],
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter returns null for an .invalid to before replaceAddress redirects', () => {
  const mail = {
    to: 'x@audit.invalid',
    subject: 'A',
  };
  const filter = {
    replaceAddress: 'catchall@example.com',
  };
  expect(applyMailFilter({ filter, mail })).toBe(null);
});

test('applyMailFilter replaceAddress redirects when a to recipient survives the .invalid drop', () => {
  const mail = {
    to: ['x@audit.invalid', 'y@real.com'],
    subject: 'A',
  };
  const filter = {
    replaceAddress: 'catchall@example.com',
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: 'catchall@example.com',
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter drops .invalid recipients before the allowlist runs', () => {
  const mail = {
    to: ['x@smoke.invalid', 'someone@example.com'],
    cc: 'c@smoke.invalid',
    subject: 'A',
  };
  const filter = {
    allowlist: ['example.com', 'smoke.invalid'],
  };
  expect(applyMailFilter({ filter, mail })).toEqual({
    to: ['someone@example.com'],
    cc: undefined,
    bcc: undefined,
    subject: 'A',
  });
});

test('applyMailFilter keeps an address on a domain of many dots without stalling', () => {
  // /\.+$/, which the code used before, took quadratic time on this input: seconds at this
  // length, against a few milliseconds now. Jest cannot time out synchronous code, so the time
  // is checked.
  const to = `a@${'.'.repeat(200000)}x`;
  const start = performance.now();
  const result = applyMailFilter({ filter: null, mail: { to } });
  const ms = performance.now() - start;
  expect(result).toEqual({ to, cc: undefined, bcc: undefined });
  expect(ms).toBeLessThan(1000);
});
