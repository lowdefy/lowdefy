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
import { createNodeLogger } from '@lowdefy/logger/node';
import { serializer } from '@lowdefy/helpers';

const secret = 'planted-dev-secret-value';

const lines = [];
const destination = {
  write(line) {
    lines.push(line);
  },
};

// The CLI's dev terminal is parsed from this logger's output, so it must keep the full default
// serialization; route the real logger to memory to read the exact emitted line.
jest.unstable_mockModule('@lowdefy/logger/node', () => ({
  createNodeLogger: (options) => createNodeLogger({ ...options, destination }),
}));

process.env.LOWDEFY_SECRET_API_KEY = secret;

const { default: createLogger } = await import('./createLogger.js');

function createAxiosError() {
  const error = new Error(`Request failed for key ${secret}`);
  error.name = 'AxiosError';
  error.code = 'ERR_BAD_REQUEST';
  error.config = {
    auth: { username: 'svc-user', password: 'planted-config-password' },
    params: { api_key: 'planted-config-param' },
    headers: { Authorization: 'Bearer planted-config-header' },
  };
  return error;
}

test('dev logger writes an axios error with full default serialization and no scrub', () => {
  const error = createAxiosError();
  createLogger().error({ err: error }, error.message);
  expect(lines).toHaveLength(1);
  const { err, msg } = JSON.parse(lines[0]);
  expect(err).toEqual(JSON.parse(JSON.stringify(serializer.serialize(error)['~e'])));
  expect(err.config.auth.password).toBe('planted-config-password');
  expect(err.config.params.api_key).toBe('planted-config-param');
  expect(err.config.headers.Authorization).toBe('Bearer planted-config-header');
  expect(msg).toBe(`Request failed for key ${secret}`);
});
