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
import warnAuthUrlPortMismatch from './warnAuthUrlPortMismatch.mjs';

const originalAuthUrl = process.env.AUTH_URL;
const originalNextAuthUrl = process.env.NEXTAUTH_URL;

function createContext(port) {
  return {
    options: { port },
    logger: { warn: jest.fn() },
  };
}

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

beforeEach(() => {
  delete process.env.AUTH_URL;
  delete process.env.NEXTAUTH_URL;
});

afterEach(() => {
  restoreEnv('AUTH_URL', originalAuthUrl);
  restoreEnv('NEXTAUTH_URL', originalNextAuthUrl);
});

test('warnAuthUrlPortMismatch stays silent when no auth URL is set', () => {
  const context = createContext(3001);
  warnAuthUrlPortMismatch({ context });
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('warnAuthUrlPortMismatch stays silent when AUTH_URL matches the dev port', () => {
  process.env.AUTH_URL = 'http://localhost:3000';
  const context = createContext(3000);
  warnAuthUrlPortMismatch({ context });
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('warnAuthUrlPortMismatch warns when AUTH_URL port does not match', () => {
  process.env.AUTH_URL = 'http://localhost:3000';
  const context = createContext(3001);
  warnAuthUrlPortMismatch({ context });
  expect(context.logger.warn).toHaveBeenCalledTimes(1);
  expect(context.logger.warn.mock.calls[0][0]).toContain(
    'AUTH_URL (http://localhost:3000) does not match the dev server port 3001'
  );
});

test('warnAuthUrlPortMismatch falls back to NEXTAUTH_URL and names it in the warning', () => {
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  const context = createContext(3001);
  warnAuthUrlPortMismatch({ context });
  expect(context.logger.warn).toHaveBeenCalledTimes(1);
  expect(context.logger.warn.mock.calls[0][0]).toContain('NEXTAUTH_URL (http://localhost:3000)');
});

test('warnAuthUrlPortMismatch treats an https URL without a port as 443', () => {
  process.env.AUTH_URL = 'https://example.com';
  const context = createContext(3000);
  warnAuthUrlPortMismatch({ context });
  expect(context.logger.warn).toHaveBeenCalledTimes(1);
  expect(context.logger.warn.mock.calls[0][0]).toContain('does not match the dev server port 3000');
});

test('warnAuthUrlPortMismatch warns when the auth URL is not a valid URL', () => {
  process.env.AUTH_URL = 'not-a-url';
  const context = createContext(3000);
  warnAuthUrlPortMismatch({ context });
  expect(context.logger.warn).toHaveBeenCalledTimes(1);
  expect(context.logger.warn.mock.calls[0][0]).toContain('is not a valid URL');
});
