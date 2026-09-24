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
import PasskeyRegister from './PasskeyRegister.js';

test('PasskeyRegister passes params to the passkeyRegister method', async () => {
  const mockPasskeyRegister = jest.fn();
  const methods = { passkeyRegister: mockPasskeyRegister };
  await PasskeyRegister({ methods, params: { name: 'Work laptop' } });
  expect(mockPasskeyRegister.mock.calls).toEqual([[{ name: 'Work laptop' }]]);
});

test('PasskeyRegister returns the registered passkey from the method', async () => {
  const passkey = { id: 'passkey-1', name: 'Work laptop' };
  const methods = { passkeyRegister: jest.fn(() => Promise.resolve(passkey)) };
  const result = await PasskeyRegister({ methods, params: { name: 'Work laptop' } });
  expect(result).toEqual(passkey);
});
