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
import ResetPassword from './ResetPassword.js';

const mockResetPassword = jest.fn();
const methods = { resetPassword: mockResetPassword };

test('ResetPassword passes params to the resetPassword method', async () => {
  await ResetPassword({
    methods,
    params: { newPassword: 'new-pass', token: 'reset-token' },
  });
  expect(mockResetPassword.mock.calls).toEqual([
    [{ newPassword: 'new-pass', token: 'reset-token' }],
  ]);
});
