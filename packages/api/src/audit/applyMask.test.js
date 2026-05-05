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

import applyMask from './applyMask.js';

test('applyMask masks heuristic password keys regardless of mask list', () => {
  const result = applyMask({ username: 'alice', password: 'hunter2' });
  expect(result.username).toBe('alice');
  expect(result.password).toBe('***MASKED***');
});

test('applyMask masks token, secret, authorization, apikey heuristically', () => {
  const result = applyMask({
    accessToken: 'abc',
    apiSecret: 'xyz',
    Authorization: 'Bearer 123',
    apiKey: 'k',
    safe: 'visible',
  });
  expect(result.accessToken).toBe('***MASKED***');
  expect(result.apiSecret).toBe('***MASKED***');
  expect(result.Authorization).toBe('***MASKED***');
  expect(result.apiKey).toBe('***MASKED***');
  expect(result.safe).toBe('visible');
});

test('applyMask masks user-supplied keys exactly', () => {
  const result = applyMask({ ssn: '123', email: 'a@b.c' }, ['ssn']);
  expect(result.ssn).toBe('***MASKED***');
  expect(result.email).toBe('a@b.c');
});

test('applyMask recurses into nested objects', () => {
  const result = applyMask({
    user: { name: 'alice', password: 'p' },
    meta: { secret: 's', other: 'visible' },
  });
  expect(result.user.password).toBe('***MASKED***');
  expect(result.user.name).toBe('alice');
  expect(result.meta.secret).toBe('***MASKED***');
  expect(result.meta.other).toBe('visible');
});

test('applyMask recurses into arrays of objects', () => {
  const result = applyMask({ users: [{ password: 'a' }, { password: 'b' }] });
  expect(result.users[0].password).toBe('***MASKED***');
  expect(result.users[1].password).toBe('***MASKED***');
});

test('applyMask handles circular references without crashing', () => {
  const a = { name: 'a' };
  a.self = a;
  const result = applyMask({ wrapper: a });
  expect(result.wrapper.name).toBe('a');
  expect(result.wrapper.self).toBe('[Circular]');
});

test('applyMask truncates strings over 10000 chars', () => {
  const longString = 'x'.repeat(15000);
  const result = applyMask({ note: longString });
  expect(result.note.length).toBeLessThan(longString.length);
  expect(result.note.endsWith('[truncated]')).toBe(true);
});

test('applyMask leaves strings under the limit unchanged', () => {
  const note = 'x'.repeat(500);
  const result = applyMask({ note });
  expect(result.note).toBe(note);
});

test('applyMask handles primitive top-level values', () => {
  expect(applyMask(null)).toBeNull();
  expect(applyMask(undefined)).toBeUndefined();
  expect(applyMask(42)).toBe(42);
  expect(applyMask('plain')).toBe('plain');
});
