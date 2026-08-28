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
import PasskeyUpdate from './PasskeyUpdate.js';

test('PasskeyUpdate passes params to the passkeyUpdate method', async () => {
  const mockPasskeyUpdate = jest.fn();
  const methods = { passkeyUpdate: mockPasskeyUpdate };
  await PasskeyUpdate({ methods, params: { passkeyId: 'passkey-1', name: 'MacBook Touch ID' } });
  expect(mockPasskeyUpdate.mock.calls).toEqual([
    [{ passkeyId: 'passkey-1', name: 'MacBook Touch ID' }],
  ]);
});

test('PasskeyUpdate returns the updated passkey from the method', async () => {
  const passkey = { id: 'passkey-1', name: 'MacBook Touch ID' };
  const methods = { passkeyUpdate: jest.fn(() => Promise.resolve(passkey)) };
  const result = await PasskeyUpdate({
    methods,
    params: { passkeyId: 'passkey-1', name: 'MacBook Touch ID' },
  });
  expect(result).toEqual(passkey);
});
