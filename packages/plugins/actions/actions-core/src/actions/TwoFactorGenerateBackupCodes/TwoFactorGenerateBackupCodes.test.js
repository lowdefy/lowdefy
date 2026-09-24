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
import TwoFactorGenerateBackupCodes from './TwoFactorGenerateBackupCodes.js';

test('TwoFactorGenerateBackupCodes passes params to the twoFactorGenerateBackupCodes method', async () => {
  const mockTwoFactorGenerateBackupCodes = jest.fn();
  const methods = { twoFactorGenerateBackupCodes: mockTwoFactorGenerateBackupCodes };
  await TwoFactorGenerateBackupCodes({ methods, params: { password: 'pass-123' } });
  expect(mockTwoFactorGenerateBackupCodes.mock.calls).toEqual([[{ password: 'pass-123' }]]);
});

test('TwoFactorGenerateBackupCodes returns the backup codes from the method', async () => {
  const response = { status: true, backupCodes: ['code-1', 'code-2'] };
  const methods = { twoFactorGenerateBackupCodes: jest.fn(() => Promise.resolve(response)) };
  const result = await TwoFactorGenerateBackupCodes({ methods, params: { password: 'pass-123' } });
  expect(result).toEqual(response);
});
