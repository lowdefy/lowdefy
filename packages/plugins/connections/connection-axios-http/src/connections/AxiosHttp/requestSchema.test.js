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

import { validate } from '@lowdefy/ajv';
import { expect, test } from 'vitest';

import connectionSchema from './schema.js';
import requestSchema from './requestSchema.js';

test('request schema accepts the request properties', () => {
  const request = {
    url: '/orders',
    method: 'post',
    headers: { header: 'value' },
    params: { param: 'value' },
    data: { data: 'value' },
    timeout: 240,
    maxRedirects: 2,
  };
  expect(validate({ schema: requestSchema, data: request })).toEqual({ valid: true });
});

test.each([
  ['allowInternalAddresses', true],
  ['allowedHosts', ['internal.example.com']],
  ['allowAbsoluteUrls', true],
  ['httpAgentOptions', {}],
  ['httpsAgentOptions', {}],
  ['httpVersion', 2],
  ['proxy', { host: '10.0.0.1', port: 3128 }],
  ['socketPath', '/var/run/docker.sock'],
])('request schema refuses connection-only property %s', (key, value) => {
  expect(() => validate({ schema: requestSchema, data: { url: '/x', [key]: value } })).toThrow(
    `AxiosHttp property "${key}" can only be set on the connection.`
  );
});

test.each(['adapter', 'beforeRedirect', 'httpAgent', 'httpsAgent', 'lookup', 'transport'])(
  'request and connection schemas refuse unsupported property %s',
  (key) => {
    const message = `AxiosHttp property "${key}" is not supported`;
    expect(() => validate({ schema: requestSchema, data: { [key]: 'x' } })).toThrow(message);
    expect(() => validate({ schema: connectionSchema, data: { [key]: 'x' } })).toThrow(message);
  }
);

test('connection schema accepts allowInternalAddresses, allowedHosts and socketPath', () => {
  const connection = {
    baseURL: 'http://localhost:4000',
    allowInternalAddresses: true,
    allowedHosts: ['localhost'],
    socketPath: '/var/run/docker.sock',
    httpAgentOptions: { keepAlive: true },
    httpsAgentOptions: { keepAlive: true },
  };
  expect(validate({ schema: connectionSchema, data: connection })).toEqual({ valid: true });
});

test('connection schema refuses allowedHosts that is not an array of strings', () => {
  expect(() => validate({ schema: connectionSchema, data: { allowedHosts: 'localhost' } })).toThrow(
    'AxiosHttp property "allowedHosts" should be an array of strings.'
  );
});

test('connection schema refuses allowInternalAddresses that is not a boolean', () => {
  expect(() =>
    validate({ schema: connectionSchema, data: { allowInternalAddresses: 'yes' } })
  ).toThrow('AxiosHttp property "allowInternalAddresses" should be a boolean.');
});
