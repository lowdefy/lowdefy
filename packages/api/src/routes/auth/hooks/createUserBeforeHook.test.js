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

import { APIError } from 'better-auth/api';
import { ConfigError } from '@lowdefy/errors';

import createUserAfterHook from './createUserAfterHook.js';
import createUserBeforeHook from './createUserBeforeHook.js';

const hook = { id: 'test-hook', point: 'user.create.before', endpointId: 'auth/test' };

test('before hook wraps :return data as { data }', async () => {
  const userHook = createUserBeforeHook({
    dispatch: async () => ({ status: 'return', response: { name: 'X' } }),
    hook,
  });
  expect(await userHook({ name: 'A' })).toEqual({ data: { name: 'X' } });
});

test('before hook returns undefined when the routine falls through', async () => {
  const userHook = createUserBeforeHook({
    dispatch: async () => ({ status: 'continue' }),
    hook,
  });
  expect(await userHook({ name: 'A' })).toBeUndefined();
});

test('before hook throws a ConfigError when :return data is not an object', async () => {
  const userHook = createUserBeforeHook({
    dispatch: async () => ({ status: 'return', response: 42 }),
    hook,
  });
  await expect(userHook({ name: 'A' })).rejects.toThrow(ConfigError);
  await expect(userHook({ name: 'A' })).rejects.toThrow(
    'Auth hook "test-hook" at point "user.create.before" returned a number.'
  );
});

test('before hook maps :reject to an APIError with the reject message', async () => {
  const userHook = createUserBeforeHook({
    dispatch: async () => ({ status: 'reject', error: new Error('blocked') }),
    hook,
  });
  await expect(userHook({ name: 'A' })).rejects.toThrow(APIError);
  await expect(userHook({ name: 'A' })).rejects.toThrow('blocked');
});

test('before hook rethrows the routine error on error status', async () => {
  const routineError = new Error('exploded');
  const userHook = createUserBeforeHook({
    dispatch: async () => ({ status: 'error', error: routineError }),
    hook,
  });
  await expect(userHook({ name: 'A' })).rejects.toBe(routineError);
});

test('after hook resolves undefined on return and continue', async () => {
  const returned = createUserAfterHook({
    dispatch: async () => ({ status: 'return', response: { ignored: true } }),
  });
  const fellThrough = createUserAfterHook({
    dispatch: async () => ({ status: 'continue' }),
  });
  await expect(returned({ id: 's1' })).resolves.toBeUndefined();
  await expect(fellThrough({ id: 's1' })).resolves.toBeUndefined();
});

test('after hook maps :reject to an APIError and rethrows routine errors', async () => {
  const rejected = createUserAfterHook({
    dispatch: async () => ({ status: 'reject', error: new Error('no') }),
  });
  const routineError = new Error('exploded');
  const errored = createUserAfterHook({
    dispatch: async () => ({ status: 'error', error: routineError }),
  });
  await expect(rejected({ id: 's1' })).rejects.toThrow(APIError);
  await expect(errored({ id: 's1' })).rejects.toBe(routineError);
});
