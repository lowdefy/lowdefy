/*
  Copyright 2020-2024 Lowdefy, Inc

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
import AxiosHttp from './AxiosHttp.js';

const schema = AxiosHttp.schema;

test('All requests are present', () => {
  expect(AxiosHttp.requests.AxiosHttp).toBeDefined();
});

test('valid connection schema', () => {
  const connection = {
    url: 'https://example.com/api',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, all properties', () => {
  const connection = {
    url: '/path',
    method: 'get',
    baseURL: 'https://example.com/api',
    headers: {
      header: 'value',
    },
    params: {
      param: 'value',
    },
    data: {
      data: 'value',
    },
    timeout: 240,
    auth: {
      username: 'username',
      password: 'password',
    },
    responseType: 'json',
    responseEncoding: 'utf8',
    maxContentLength: 4000,
    maxRedirects: 7,
    proxy: {
      host: '127.0.0.1',
      port: 4030,
    },
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('url is not a string', () => {
  const connection = {
    url: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'AxiosHttp property "url" should be a string.'
  );
});

test('data is a string', () => {
  const connection = {
    method: 'post',
    url: 'https://example.com/api',
    data: 'value',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('data is an array', () => {
  const connection = {
    method: 'post',
    url: 'https://example.com/api',
    data: [{ key: 'value' }],
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});
