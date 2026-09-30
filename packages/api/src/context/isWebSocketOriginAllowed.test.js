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

import isWebSocketOriginAllowed from './isWebSocketOriginAllowed.js';

function createContext({ config = {} } = {}) {
  return {
    config,
    logger: { warn: jest.fn() },
  };
}

function check({ context, headers }) {
  return isWebSocketOriginAllowed({ context, getHeader: (name) => headers[name] });
}

test('isWebSocketOriginAllowed accepts the environment url behind a proxy that rewrites Host', () => {
  const context = createContext({
    config: { environment: 'prod', environments: { prod: { url: 'https://app.example.com' } } },
  });
  const headers = { host: 'localhost:3000', origin: 'https://app.example.com' };
  expect(check({ context, headers })).toBe(true);
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('isWebSocketOriginAllowed accepts the AUTH_URL origin behind a proxy that rewrites Host', () => {
  process.env.AUTH_URL = 'https://app.example.com';
  try {
    const headers = { host: 'localhost:3000', origin: 'https://app.example.com' };
    expect(check({ context: createContext(), headers })).toBe(true);
  } finally {
    delete process.env.AUTH_URL;
  }
});

test('isWebSocketOriginAllowed logs the Origin and Host of a refused upgrade', () => {
  const context = createContext();
  const headers = { host: 'app.test', origin: 'https://other.test' };
  expect(check({ context, headers })).toBe(false);
  expect(context.logger.warn).toHaveBeenCalledWith(
    expect.objectContaining({
      event: 'ws_origin_refused',
      origin: 'https://other.test',
      host: 'app.test',
    }),
    expect.stringContaining('X-Forwarded-Host')
  );
});
