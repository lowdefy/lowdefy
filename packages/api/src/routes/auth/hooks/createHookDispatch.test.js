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

const invokeEndpoint = jest.fn(async () => ({ status: 'continue' }));

jest.unstable_mockModule('../../endpoints/invokeEndpoint.js', () => ({
  default: invokeEndpoint,
}));

const { default: createHookDispatch } = await import('./createHookDispatch.js');

const createSystemContext = () => ({
  logger: { debug: () => {} },
});
const getAuth = () => ({});

beforeEach(() => {
  invokeEndpoint.mockClear();
});

test('injects the firing point onto a database point payload', async () => {
  const hook = { id: 'test-hook', point: 'user.create.before', endpointId: 'auth/test' };
  const dispatch = createHookDispatch({ createSystemContext, getAuth, hook });

  await dispatch({ id: 'u1', name: 'Ada' });

  expect(invokeEndpoint).toHaveBeenCalledTimes(1);
  const [, { payload }] = invokeEndpoint.mock.calls[0];
  expect(payload).toEqual({
    user: { id: 'u1', name: 'Ada' },
    point: 'user.create.before',
  });
});

test('injects the firing point onto a synthetic point payload', async () => {
  const hook = { id: 'merge-hook', point: 'email.verified', endpointId: 'auth/merge' };
  const dispatch = createHookDispatch({ createSystemContext, getAuth, hook });

  await dispatch({ id: 'u1', email: 'ada@example.com' });

  expect(invokeEndpoint).toHaveBeenCalledTimes(1);
  const [, { payload }] = invokeEndpoint.mock.calls[0];
  expect(payload).toEqual({
    user: { id: 'u1', email: 'ada@example.com' },
    point: 'email.verified',
  });
});
