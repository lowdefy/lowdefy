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

import { jest } from '@jest/globals';
import Fetch from './Fetch.js';

const json = jest.fn(() => Promise.resolve('json'));
const text = jest.fn(() => Promise.resolve('text'));

const fetch = jest.fn(() => Promise.resolve({ fetchResponse: true, json, text }));

const globals = { fetch };

test('Fetch a url, ', async () => {
  const params = { url: 'https://example.com' };
  const res = await Fetch({ globals, params });
  expect(res).toEqual({ fetchResponse: true, json, text });
  expect(fetch.mock.calls).toEqual([['https://example.com', undefined]]);
});

test('Fetch a url with options, ', async () => {
  const params = {
    url: 'https://example.com',
    options: { headers: { header: 'value' }, method: 'POST' },
  };
  const res = await Fetch({ globals, params });
  expect(res).toEqual({ fetchResponse: true, json, text });
  expect(fetch.mock.calls).toEqual([
    [
      'https://example.com',
      {
        headers: {
          header: 'value',
        },
        method: 'POST',
      },
    ],
  ]);
  expect(text.mock.calls).toEqual([]);
  expect(json.mock.calls).toEqual([]);
});

test('Fetch call the text response function, ', async () => {
  const params = {
    url: 'https://example.com',
    responseFunction: 'text',
  };
  const res = await Fetch({ globals, params });
  expect(res).toEqual('text');
  expect(fetch.mock.calls).toEqual([['https://example.com', undefined]]);
  expect(text.mock.calls).toEqual([[]]);
  expect(json.mock.calls).toEqual([]);
});

test('Fetch call the json response function, ', async () => {
  const params = {
    url: 'https://example.com',
    responseFunction: 'json',
  };
  const res = await Fetch({ globals, params });
  expect(res).toEqual('json');
  expect(fetch.mock.calls).toEqual([['https://example.com', undefined]]);
  expect(text.mock.calls).toEqual([]);
  expect(json.mock.calls).toEqual([[]]);
});
