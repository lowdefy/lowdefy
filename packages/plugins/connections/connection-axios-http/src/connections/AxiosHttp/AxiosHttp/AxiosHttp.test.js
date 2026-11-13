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

import http from 'http';

import { RequestError } from '@lowdefy/errors';

import AxiosHttp from './AxiosHttp.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

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
    'Http response "404: Not Found".'
  );
});

describe('non-2xx response', () => {
  let server;
  let url;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      res.statusCode = 404;
      res.end('Not Found');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${server.address().port}/missing`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('a 404 upstream throws an Error with code ERR_BAD_REQUEST and statusCode 404', async () => {
    const error = await AxiosHttp({
      request: { url },
      connection: { allowInternalAddresses: true },
    }).catch((e) => e);
    expect(error.message).toBe('Http response "404: Not Found".');
    expect(error.code).toBe('ERR_BAD_REQUEST');
    expect(error.statusCode).toBe(404);
    expect(error.cause.response.status).toBe(404);
  });

  test('a RequestError wrapping a 404 upstream error reports code ERR_BAD_REQUEST and statusCode 404', async () => {
    const error = await AxiosHttp({
      request: { url },
      connection: { allowInternalAddresses: true },
    }).catch((e) => e);
    const requestError = new RequestError(error.message, {
      cause: error,
      typeName: 'AxiosHttp',
      received: { url },
      location: 'api/request',
      configKey: 'key',
    });
    expect(requestError.code).toBe('ERR_BAD_REQUEST');
    expect(requestError.statusCode).toBe(404);
  });
});

describe('internal addresses', () => {
  let server;
  let port;
  let hits;

  beforeAll(async () => {
    hits = 0;
    server = http.createServer((req, res) => {
      hits += 1;
      if (req.url === '/redirect-localhost') {
        res.statusCode = 302;
        res.setHeader('location', `http://localhost:${port}/ok`);
        res.end();
        return;
      }
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = server.address().port;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('a request to a private IP literal is refused before connecting', async () => {
    const before = hits;
    const error = await AxiosHttp({
      request: { url: `http://127.0.0.1:${port}/ok` },
      connection: {},
    }).catch((e) => e);
    expect(error.message).toBe(
      'AxiosHttp request to "127.0.0.1" was refused because it leads to an address that is not public. Set "allowInternalAddresses: true" on the connection to call a service on the same machine or network.'
    );
    expect(error.code).toBe('ERR_AXIOS_HTTP_REFUSED');
    expect(hits).toBe(before);
  });

  test('a request to the cloud metadata address is refused', async () => {
    const error = await AxiosHttp({
      request: { url: 'http://169.254.169.254/latest/meta-data/' },
      connection: {},
    }).catch((e) => e);
    expect(error.message).toMatch('"169.254.169.254" was refused');
  });

  test('a request to a hostname that resolves to a private address is refused', async () => {
    const before = hits;
    const error = await AxiosHttp({
      request: { url: `http://localhost:${port}/ok` },
      connection: {},
    }).catch((e) => e);
    expect(error.message).toMatch('AxiosHttp request to "localhost" was refused');
    expect(hits).toBe(before);
  });

  test('allowInternalAddresses on the request does not lift the refusal', async () => {
    const error = await AxiosHttp({
      request: { url: `http://127.0.0.1:${port}/ok`, allowInternalAddresses: true },
      connection: {},
    }).catch((e) => e);
    expect(error.message).toMatch('"127.0.0.1" was refused');
  });

  test('allowInternalAddresses on the connection allows a private address', async () => {
    const res = await AxiosHttp({
      request: { url: `http://127.0.0.1:${port}/ok` },
      connection: { allowInternalAddresses: true },
    });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ ok: true });
  });

  test('allowedHosts allows a listed host', async () => {
    const res = await AxiosHttp({
      request: { url: `http://127.0.0.1:${port}/ok` },
      connection: { allowInternalAddresses: true, allowedHosts: ['127.0.0.1'] },
    });
    expect(res.status).toBe(200);
  });

  test('allowedHosts refuses an unlisted host before connecting', async () => {
    const before = hits;
    const error = await AxiosHttp({
      request: { url: `http://127.0.0.1:${port}/ok` },
      connection: { allowInternalAddresses: true, allowedHosts: ['api.example.com'] },
    }).catch((e) => e);
    expect(error.message).toBe(
      'AxiosHttp request to "127.0.0.1" was refused because the host is not in the connection\'s "allowedHosts".'
    );
    expect(hits).toBe(before);
  });

  test('allowedHosts refuses a redirect to an unlisted host', async () => {
    const error = await AxiosHttp({
      request: { url: `http://127.0.0.1:${port}/redirect-localhost` },
      connection: { allowInternalAddresses: true, allowedHosts: ['127.0.0.1'] },
    }).catch((e) => e);
    expect(error.message).toBe(
      'AxiosHttp request to "localhost" was refused because the host is not in the connection\'s "allowedHosts".'
    );
    expect(error.code).toBe('ERR_AXIOS_HTTP_REFUSED');
  });

  test('a socketPath on the request is ignored', async () => {
    const error = await AxiosHttp({
      request: { url: `http://127.0.0.1:${port}/ok`, socketPath: '/var/run/docker.sock' },
      connection: {},
    }).catch((e) => e);
    expect(error.message).toMatch('"127.0.0.1" was refused');
  });
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
