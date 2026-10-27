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
import { RequestError, UserError } from '@lowdefy/errors';

import createNetworkError from '../test/createNetworkError.js';
import reportShellError from './reportShellError.js';

function createSession(handleError) {
  return { getState: () => ({ lowdefy: { _internal: { handleError } } }) };
}

let consoleError;

beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

test('a fault goes to the core handleError once a page has made one', () => {
  const handleError = jest.fn(async () => {});
  const error = new RequestError('Something went wrong.');
  reportShellError({ error, session: createSession(handleError) });
  expect(handleError).toHaveBeenCalledWith(error);
  expect(consoleError).not.toHaveBeenCalled();
});

test('a fault goes to the device console before any page made a core', () => {
  const error = new Error('Push token registration failed.');
  reportShellError({ error, session: { getState: () => ({ lowdefy: { buildId: 'b1' } }) } });
  expect(consoleError).toHaveBeenCalledWith(error);
});

test('a fault goes to the device console when no app is open', () => {
  const error = new Error('The shell could not open its database.');
  reportShellError({ error });
  expect(consoleError).toHaveBeenCalledWith(error);
});

test('no network and expected outcomes are not reported', () => {
  const handleError = jest.fn(async () => {});
  const session = createSession(handleError);
  reportShellError({ error: createNetworkError(), session });
  reportShellError({ error: new UserError('Camera permission was denied.'), session });
  const refusal = new Error('Not allowed.');
  refusal.name = 'AuthorizationError';
  reportShellError({ error: refusal, session });
  expect(handleError).not.toHaveBeenCalled();
  expect(consoleError).not.toHaveBeenCalled();
});

test('a handleError that fails falls back to the device console', async () => {
  const error = new Error('Background fetch failed.');
  reportShellError({
    error,
    session: createSession(async () => {
      throw new Error('Logger gone.');
    }),
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(consoleError).toHaveBeenCalledWith(error);
});
