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

import createAuthLogger from './createAuthLogger.js';

function createLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    isLevelEnabled: () => false,
  };
}

test('createAuthLogger logs an Error arg under err and names other args by type only', () => {
  const logger = createLogger();
  const error = new Error('Invalid login: 535');
  error.rejected = ['planted@example.com'];
  createAuthLogger({ logger }).log(
    'error',
    'Failed to run background task:',
    error,
    { email: 'planted@example.com' },
    'planted-token'
  );
  expect(logger.error).toHaveBeenCalledWith(
    { event: 'auth_engine', err: error, argTypes: ['object', 'string'] },
    'Failed to run background task:'
  );
  expect(JSON.stringify(logger.error.mock.calls[0][0].argTypes)).not.toContain('planted');
});

test('createAuthLogger writes a line with no args as the event and message alone', () => {
  const logger = createLogger();
  createAuthLogger({ logger }).log('warn', 'Rate limit hit.');
  expect(logger.warn).toHaveBeenCalledWith({ event: 'auth_engine' }, 'Rate limit hit.');
});

test('createAuthLogger writes an error Lowdefy already reported at debug', () => {
  const logger = createLogger();
  const error = new Error('SMTP refused.');
  error.handled = true;
  createAuthLogger({ logger }).log('error', 'Failed to run background task:', error);
  expect(logger.error).not.toHaveBeenCalled();
  expect(logger.debug).toHaveBeenCalledWith(
    { event: 'auth_engine', err: error },
    'Failed to run background task:'
  );
});
