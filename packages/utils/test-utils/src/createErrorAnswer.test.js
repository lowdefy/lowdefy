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

import * as api from '@lowdefy/api';
import * as errors from '@lowdefy/errors';
import * as helpers from '@lowdefy/helpers';
import { expect, test, vi } from 'vitest';

import createErrorAnswer from './createErrorAnswer.js';

const testApp = { modules: { api, errors, helpers } };

function createContext() {
  return { handleError: vi.fn(async () => {}), mode: 'prod', rid: 'rid-1' };
}

test.each([
  ['AuthenticationError', 401],
  ['AuthorizationError', 403],
  ['TwoFactorEnrolmentRequiredError', 403],
  ['UserError', 400],
])(
  'createErrorAnswer answers a thrown %s with status %i and its name and message',
  async (name, status) => {
    const context = createContext();
    const faults = [];
    const answer = await createErrorAnswer({
      context,
      error: new errors[name]('No.'),
      faults,
      testApp,
    });
    expect(answer.status).toEqual(status);
    expect(answer.success).toBe(false);
    expect(answer.response).toBeNull();
    expect(answer.body).toEqual({ name, message: 'No.' });
    expect(answer.error).toBeInstanceOf(Error);
    expect(answer.error.name).toEqual(name);
    expect(answer.error.message).toEqual('No.');
    // An expected outcome is not a fault: it is never handed to the sink.
    expect(context.handleError).not.toHaveBeenCalled();
    expect(answer.faults).toBe(faults);
  }
);

test('createErrorAnswer answers a fault with 500, hands it to the sink, and keeps its message off the wire', async () => {
  const context = createContext();
  const fault = new errors.ConfigError('Connection "ledger" does not exist.', { configKey: 'k1' });
  const answer = await createErrorAnswer({ context, error: fault, faults: [], testApp });
  expect(context.handleError).toHaveBeenCalledWith(fault);
  expect(answer.status).toEqual(500);
  expect(answer.success).toBe(false);
  expect(answer.error.name).toEqual('ConfigError');
  expect(answer.error.message).not.toContain('ledger');
  expect(answer.body['~e'].message).toEqual(answer.error.message);
  expect(answer.body['~e'].requestId).toEqual('rid-1');
  expect(answer.body.devError).toBeUndefined();
});

test('createErrorAnswer answers an error that is not a Lowdefy error as a fault', async () => {
  const context = createContext();
  const answer = await createErrorAnswer({
    context,
    error: new TypeError('x is not a function'),
    faults: [],
    testApp,
  });
  expect(answer.status).toEqual(500);
  expect(context.handleError).toHaveBeenCalledTimes(1);
  expect(answer.error.name).toEqual('Error');
});
