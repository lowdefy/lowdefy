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
import TwoFactorEnable from './TwoFactorEnable.js';

test('TwoFactorEnable passes params to the twoFactorEnable method', async () => {
  const mockTwoFactorEnable = jest.fn();
  const methods = { twoFactorEnable: mockTwoFactorEnable };
  await TwoFactorEnable({ methods, params: { password: 'pass-123' } });
  expect(mockTwoFactorEnable.mock.calls).toEqual([[{ password: 'pass-123' }]]);
});

test('TwoFactorEnable returns the totpURI and backup codes from the method', async () => {
  const response = { totpURI: 'otpauth://totp/app', backupCodes: ['code-1', 'code-2'] };
  const methods = { twoFactorEnable: jest.fn(() => Promise.resolve(response)) };
  const result = await TwoFactorEnable({ methods, params: { password: 'pass-123' } });
  expect(result).toEqual(response);
});
