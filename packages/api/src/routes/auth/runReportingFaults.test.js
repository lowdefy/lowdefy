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

import { expect, test, vi } from 'vitest';
import { UserError } from '@lowdefy/errors';

import runReportingFaults from './runReportingFaults.js';

test('runReportingFaults returns what the work returns', async () => {
  const context = { handleError: vi.fn() };
  await expect(runReportingFaults({ context, run: async () => 'sent' })).resolves.toBe('sent');
  expect(context.handleError).not.toHaveBeenCalled();
});

test('runReportingFaults reports a fault through the context and rethrows it', async () => {
  const error = new Error('SMTP host is down.');
  const context = { handleError: vi.fn(async (e) => Object.assign(e, { handled: true })) };
  await expect(
    runReportingFaults({
      context,
      run: async () => {
        throw error;
      },
    })
  ).rejects.toBe(error);
  expect(context.handleError).toHaveBeenCalledWith(error);
  expect(error.handled).toBe(true);
});

test('runReportingFaults rethrows an expected outcome without reporting it', async () => {
  const error = new UserError('Delivery is filtered.');
  const context = { handleError: vi.fn() };
  await expect(
    runReportingFaults({
      context,
      run: async () => {
        throw error;
      },
    })
  ).rejects.toBe(error);
  expect(context.handleError).not.toHaveBeenCalled();
});
