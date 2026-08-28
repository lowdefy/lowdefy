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
import { UserError } from '@lowdefy/errors';

// Mocked at module top so the dynamic runRoutine import below picks up the
// thrown UserError. Isolated to this file to avoid affecting runRoutine.test.js.
jest.unstable_mockModule('./control/handleControl.js', () => ({
  default: async () => {
    throw new UserError('thrown reject', { isReject: true });
  },
}));

test('runRoutine catch returns status:reject and skips handleError when caught error has isReject', async () => {
  // Simulates a UserError thrown through the routine engine with isReject:true —
  // the shape produced when callApi propagates a target endpoint's :reject
  // across the JS throw boundary. The catch must return status 'reject' and
  // bypass context.handleError entirely (rejects are expected control flow,
  // not faults).
  const { default: runRoutine } = await import('./runRoutine.js');
  const handleError = jest.fn();
  const context = { handleError };
  const res = await runRoutine(context, {}, { routine: { ':noop': true } });
  expect(res.status).toBe('reject');
  expect(res.error.isReject).toBe(true);
  expect(res.error.message).toBe('thrown reject');
  expect(handleError).not.toHaveBeenCalled();
});

test('runRoutine catch still routes non-reject errors through handleError', async () => {
  const { default: runRoutine } = await import('./runRoutine.js');
  // The real sink (servers' createHandleError) marks the error handled once it
  // has logged it; runRoutine's guard reads that flag rather than setting it.
  const handleError = jest.fn(async (error) => {
    error.handled = true;
  });
  const context = { handleError };
  // Null routine triggers `throw new Error('Invalid routine.')` in runRoutine's
  // try block — a plain Error without isReject. Catch should call handleError
  // once and return status 'error'.
  const res = await runRoutine(context, {}, { routine: null });
  expect(res.status).toBe('error');
  expect(res.error.handled).toBe(true);
  expect(handleError).toHaveBeenCalledTimes(1);
});
