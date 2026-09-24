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

import { jest } from '@jest/globals';

import dispatchRequestHooks from './dispatchRequestHooks.js';

test('dispatchRequestHooks returns undefined when no registration matches the path', async () => {
  const handler = jest.fn();
  const result = await dispatchRequestHooks({
    ctx: { path: '/sign-in/email' },
    registrations: [{ id: 'a', matches: (path) => path === '/sign-in/magic-link', handler }],
  });
  expect(result).toBeUndefined();
  expect(handler).not.toHaveBeenCalled();
});

test('dispatchRequestHooks returns undefined with no registrations at all', async () => {
  expect(await dispatchRequestHooks({ ctx: { path: '/sign-in/email' }, registrations: [] })).toBe(
    undefined
  );
});

test('dispatchRequestHooks falls through a matching handler returning undefined to a later match', async () => {
  const first = jest.fn(async () => undefined);
  const second = jest.fn(async () => ({ status: true }));
  const result = await dispatchRequestHooks({
    ctx: { path: '/sign-in/magic-link' },
    registrations: [
      { id: 'first', matches: () => true, handler: first },
      { id: 'second', matches: () => true, handler: second },
    ],
  });
  expect(result).toEqual({ status: true });
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
});

test('dispatchRequestHooks short-circuits on the first non-undefined return', async () => {
  const first = jest.fn(async () => ({ status: true }));
  const second = jest.fn(async () => ({ status: false }));
  const result = await dispatchRequestHooks({
    ctx: { path: '/sign-in/magic-link' },
    registrations: [
      { id: 'first', matches: () => true, handler: first },
      { id: 'second', matches: () => true, handler: second },
    ],
  });
  expect(result).toEqual({ status: true });
  expect(second).not.toHaveBeenCalled();
});

test('dispatchRequestHooks returns a falsy non-undefined result rather than falling through', async () => {
  const second = jest.fn();
  const result = await dispatchRequestHooks({
    ctx: { path: '/callback/google' },
    registrations: [
      { id: 'first', matches: () => true, handler: async () => null },
      { id: 'second', matches: () => true, handler: second },
    ],
  });
  expect(result).toBeNull();
  expect(second).not.toHaveBeenCalled();
});

test('dispatchRequestHooks does not call the handler of a non-matching registration', async () => {
  const skipped = jest.fn();
  const matched = jest.fn(async () => undefined);
  await dispatchRequestHooks({
    ctx: { path: '/two-factor/verify-totp' },
    registrations: [
      { id: 'skipped', matches: (path) => path.startsWith('/sign-in/'), handler: skipped },
      { id: 'matched', matches: (path) => path.startsWith('/two-factor/'), handler: matched },
    ],
  });
  expect(skipped).not.toHaveBeenCalled();
  expect(matched).toHaveBeenCalledTimes(1);
});

test('dispatchRequestHooks lets an error thrown by a handler propagate', async () => {
  const later = jest.fn();
  await expect(
    dispatchRequestHooks({
      ctx: { path: '/sign-in/magic-link' },
      registrations: [
        {
          id: 'thrower',
          matches: () => true,
          handler: async () => {
            throw new Error('Redirect.');
          },
        },
        { id: 'later', matches: () => true, handler: later },
      ],
    })
  ).rejects.toThrow('Redirect.');
  expect(later).not.toHaveBeenCalled();
});

test('dispatchRequestHooks matches nothing when ctx has no path', async () => {
  const handler = jest.fn();
  const result = await dispatchRequestHooks({
    ctx: { body: {} },
    registrations: [
      { id: 'twoFactor', matches: (path) => path.startsWith('/two-factor/'), handler },
    ],
  });
  expect(result).toBeUndefined();
  expect(handler).not.toHaveBeenCalled();
});
