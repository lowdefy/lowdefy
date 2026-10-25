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

import SignInWithToken from './SignInWithToken.js';

test('SignInWithToken passes params to the signInWithToken method', async () => {
  const mockSignInWithToken = jest.fn();
  const methods = { signInWithToken: mockSignInWithToken };
  const params = { token: 'ldf_sit_abc' };
  await SignInWithToken({ methods, params });
  expect(mockSignInWithToken.mock.calls).toEqual([[params]]);
});

test('SignInWithToken returns the method response and rejects when the method rejects', async () => {
  const response = { status: true };
  const ok = { signInWithToken: jest.fn(() => Promise.resolve(response)) };
  expect(await SignInWithToken({ methods: ok, params: { token: 't' } })).toBe(response);
  const refused = { signInWithToken: jest.fn(() => Promise.reject(new Error('refused'))) };
  await expect(SignInWithToken({ methods: refused, params: { token: 't' } })).rejects.toThrow(
    'refused'
  );
});
