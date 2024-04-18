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

import AxiosHttp from './AxiosHttp.js';

const { checkRead, checkWrite } = AxiosHttp.meta;

test('get default method,', async () => {
  const request = {
    url: 'https://postman-echo.com/get',
  };
  const connection = {};
  const res = await AxiosHttp({ request, connection });
  expect(res.status).toBe(200);
  expect(res.statusText).toBe('OK');
  expect(res.method).toBe(undefined);
  expect(res.path).toBe(undefined);
  expect(res.headers).toMatchObject({
    'content-type': 'application/json; charset=utf-8',
    date: expect.any(String),
    etag: expect.any(String),
    'content-length': expect.any(String),
  });
  expect(res.data).toMatchObject({
    args: {},
    headers: {
      'x-forwarded-proto': 'https',
      host: 'postman-echo.com',
      accept: 'application/json, text/plain, */*',
    },
    url: 'https://postman-echo.com/get',
  });
});

test('get specify method', async () => {
  const request = {
    url: 'https://postman-echo.com/get',
    method: 'get',
  };
  const connection = {};
  const res = await AxiosHttp({ request, connection });
  expect(res.status).toBe(200);
  expect(res.statusText).toBe('OK');
  expect(res.method).toBe(undefined);
  expect(res.path).toBe(undefined);
  expect(res.headers).toMatchObject({
    'content-type': 'application/json; charset=utf-8',
    date: expect.any(String),
    etag: expect.any(String),
    'content-length': expect.any(String),
  });
  expect(res.data).toMatchObject({
    args: {},
    headers: {
      'x-forwarded-proto': 'https',
      host: 'postman-echo.com',
      accept: 'application/json, text/plain, */*',
    },
    url: 'https://postman-echo.com/get',
  });
});

test('get with params', async () => {
  const request = {
    url: 'https://postman-echo.com/get',
    method: 'get',
    params: {
      foo: 'bar',
    },
  };
  const connection = {};
  const res = await AxiosHttp({ request, connection });
  expect(res.status).toBe(200);
  expect(res.statusText).toBe('OK');
  expect(res.method).toBe(undefined);
  expect(res.path).toBe(undefined);
  expect(res.headers).toMatchObject({
    'content-type': 'application/json; charset=utf-8',
    date: expect.any(String),
    etag: expect.any(String),
    'content-length': expect.any(String),
  });
  expect(res.data).toMatchObject({
    args: {
      foo: 'bar',
    },
    headers: {
      'x-forwarded-proto': 'https',
      host: 'postman-echo.com',
      accept: 'application/json, text/plain, */*',
    },
    url: 'https://postman-echo.com/get?foo=bar',
  });
});

test('axios error', async () => {
  const request = {
    url: 'https://postman-echo.com/get',
    method: 'post',
    data: {
      foo: 'bar',
    },
  };
  const connection = {};
  await expect(AxiosHttp({ request, connection })).rejects.toThrow(
    'Request failed with status code 404; Http response "404: Not Found"; Data: "".'
  );
});

// TODO: postman response has changed. Improve tests.
// Use a mock maybe to avoid the need for a network connection
// test('https Agent options in request', async () => {
//   const request = {
//     url: 'https://postman-echo.com/get',
//     httpsAgentOptions: { keepAlive: true },
//   };
//   const connection = {};
//   const res = await AxiosHttp({ request, connection });
//   expect(res.headers.connection).toEqual('keep-alive');
// });

// test('https Agent options in connection', async () => {
//   const request = {
//     url: 'https://postman-echo.com/get',
//   };
//   const connection = { httpsAgentOptions: { keepAlive: true } };
//   const res = await AxiosHttp({ request, connection });
//   expect(res.headers.connection).toEqual('keep-alive');
// });

// test('http Agent options in request', async () => {
//   const request = {
//     url: 'http://postman-echo.com/get',
//     httpAgentOptions: { keepAlive: true },
//   };
//   const connection = {};
//   const res = await AxiosHttp({ request, connection });
//   expect(res.headers.connection).toEqual('keep-alive');
// });

// test('http Agent options in connection', async () => {
//   const request = {
//     url: 'http://postman-echo.com/get',
//   };
//   const connection = { httpAgentOptions: { keepAlive: true } };
//   const res = await AxiosHttp({ request, connection });
//   expect(res.headers.connection).toEqual('keep-alive');
// });

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be false', async () => {
  expect(checkWrite).toBe(false);
});
