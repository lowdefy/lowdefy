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
import reconcileNextAuthUrl from './reconcileNextAuthUrl.mjs';

const originalNextAuthUrl = process.env.NEXTAUTH_URL;

function createContext(port) {
  return {
    options: { port },
    logger: { warn: jest.fn() },
  };
}

afterEach(() => {
  if (originalNextAuthUrl === undefined) {
    delete process.env.NEXTAUTH_URL;
  } else {
    process.env.NEXTAUTH_URL = originalNextAuthUrl;
  }
});

test('reconcileNextAuthUrl defaults to the dev port when NEXTAUTH_URL is unset', () => {
  delete process.env.NEXTAUTH_URL;
  const context = createContext(3001);
  expect(reconcileNextAuthUrl({ context })).toBe('http://localhost:3001');
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('reconcileNextAuthUrl keeps a matching NEXTAUTH_URL without warning', () => {
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  const context = createContext(3000);
  expect(reconcileNextAuthUrl({ context })).toBe('http://localhost:3000');
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('reconcileNextAuthUrl warns on port mismatch but does not override', () => {
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  const context = createContext(3001);
  expect(reconcileNextAuthUrl({ context })).toBe('http://localhost:3000');
  expect(context.logger.warn).toHaveBeenCalledTimes(1);
  expect(context.logger.warn.mock.calls[0][0]).toContain('does not match the dev server port 3001');
});

test('reconcileNextAuthUrl warns when NEXTAUTH_URL is not a valid URL', () => {
  process.env.NEXTAUTH_URL = 'not-a-url';
  const context = createContext(3000);
  expect(reconcileNextAuthUrl({ context })).toBe('not-a-url');
  expect(context.logger.warn).toHaveBeenCalledTimes(1);
  expect(context.logger.warn.mock.calls[0][0]).toContain('is not a valid URL');
});
