import axiosHTTP from './http';
import { ConfigurationError, RequestError } from '../../context/errors';

const context = { ConfigurationError, RequestError };

describe('GET', () => {
  test('get default method,', async () => {
    const request = {
      url: 'https://postman-echo.com/get',
    };
    const connection = {};
    const res = await axiosHTTP({ request, connection, context });
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
    const res = await axiosHTTP({ request, connection, context });
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
    const res = await axiosHTTP({ request, connection, context });
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
  await expect(axiosHTTP({ request, connection, context })).rejects.toThrow(RequestError);
  await expect(axiosHTTP({ request, connection, context })).rejects.toThrow(
    'Status: 404, Not Found; Data: ""'
  );
});

test('other error', async () => {
  await expect(axiosHTTP({ request: '', connection: '', context })).rejects.toThrow();
});
