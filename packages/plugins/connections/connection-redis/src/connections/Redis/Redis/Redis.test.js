/*
  Copyright 2020-2021 Lowdefy, Inc

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
import Redis from './Redis.js';

const { checkRead, checkWrite } = Redis.meta;
const schema = Redis.schema;

jest.mock('redis', () => {
  return {
    createClient: jest.fn(),
  };
});

let mockedCreateClient;

beforeAll(async () => {
  mockedCreateClient = (await import('redis')).createClient;
});

test('redis command with connection as an object', async () => {
  const client = {
    on: jest.fn(),
    connect: jest.fn().mockImplementation(() => Promise.resolve()),
    GET: jest.fn().mockImplementation(() => Promise.resolve(response)),
    quit: jest.fn().mockImplementation(() => Promise.resolve()),
  };
  mockedCreateClient.mockImplementationOnce(() => client);
  const connection = {
    connection: {
      password: 'password',
      socket: {
        host: 'host',
        port: 1,
      },
    },
  };
  const request = {
    command: 'get',
    parameters: ['key'],
    modifiers: {
      a: true,
      b: false,
    },
  };
  const response = 'responseValue';
  const res = await Redis({ request, connection });
  expect(mockedCreateClient.mock.calls).toEqual([[connection.connection]]);
  expect(client.connect).toHaveBeenCalledTimes(1);
  expect(client.GET.mock.calls).toEqual([['key', { A: true, B: false }]]);
  expect(client.quit).toHaveBeenCalledTimes(1);
  expect(res).toEqual(response);
});

test('redis command with connection as a string', async () => {
  const client = {
    on: jest.fn(),
    connect: jest.fn().mockImplementation(() => Promise.resolve()),
    GET: jest.fn().mockImplementation(() => Promise.resolve(response)),
    quit: jest.fn().mockImplementation(() => Promise.resolve()),
  };
  mockedCreateClient.mockImplementationOnce(() => client);
  const connection = {
    connection: 'redis://user:password@redis:server.com:5000/4',
  };
  const request = {
    command: 'get',
    parameters: ['key'],
    modifiers: {
      a: true,
      b: false,
    },
  };
  const response = 'responseValue';
  const res = await Redis({ request, connection });
  expect(mockedCreateClient.mock.calls).toEqual([[{ url: connection.connection }]]);
  expect(client.connect).toHaveBeenCalledTimes(1);
  expect(client.GET.mock.calls).toEqual([['key', { A: true, B: false }]]);
  expect(client.quit).toHaveBeenCalledTimes(1);
  expect(res).toEqual(response);
});

test('connection error', async () => {
  const client = {
    on: jest.fn((event, cb) => {
      if (event === 'error') {
        cb(new Error('connection error'));
      }
    }),
    connect: jest.fn().mockImplementation(() => Promise.reject()),
  };
  mockedCreateClient.mockImplementationOnce(() => client);
  const connection = {
    connection: {
      password: 'password',
      socket: {
        host: 'host',
        port: 1,
      },
    },
  };
  const request = {
    command: 'get',
    parameters: ['key'],
    modifiers: {
      a: true,
      b: false,
    },
  };
  await expect(Redis({ request, connection })).rejects.toThrow('connection error');
});

test('invalid command', async () => {
  const client = {
    on: jest.fn(),
    connect: jest.fn().mockImplementation(() => Promise.resolve()),
  };
  mockedCreateClient.mockImplementationOnce(() => client);
  const connection = {
    connection: {
      password: 'password',
      socket: {
        host: 'host',
        port: 1,
      },
    },
  };
  const request = {
    command: 'get',
    parameters: ['key'],
    modifiers: {
      a: true,
      b: false,
    },
  };
  await expect(Redis({ request, connection })).rejects.toThrow('Invalid redis command "get".');
});

test('invalid parameters type', async () => {
  const client = {
    on: jest.fn(),
    connect: jest.fn().mockImplementation(() => Promise.resolve()),
    GET: jest.fn().mockImplementation(() => Promise.resolve()),
  };
  mockedCreateClient.mockImplementationOnce(() => client);
  const connection = {
    connection: {
      password: 'password',
      socket: {
        host: 'host',
        port: 1,
      },
    },
  };
  const request = {
    command: 'get',
    parameters: 'key',
    modifiers: {
      a: true,
      b: false,
    },
  };
  await expect(Redis({ request, connection })).rejects.toThrow(
    'Invalid parameters, command "get" parameters should be an array, received "key".'
  );
});

test('invalid parameters number', async () => {
  const client = {
    on: jest.fn(),
    connect: jest.fn().mockImplementation(() => Promise.resolve()),
    SET: jest.fn().mockImplementation(() => Promise.reject(new Error('SET error'))),
    quit: jest.fn().mockImplementation(() => Promise.resolve()),
  };
  mockedCreateClient.mockImplementationOnce(() => client);
  const connection = {
    connection: {
      password: 'password',
      socket: {
        host: 'host',
        port: 1,
      },
    },
  };
  const request = {
    command: 'SET',
    parameters: ['key'],
    modifiers: {
      a: true,
      b: false,
    },
  };
  await expect(Redis({ request, connection })).rejects.toThrow('SET error');
});

test('valid request schema, with url', () => {
  const request = {
    command: 'set',
    parameters: ['key', 10],
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('command is not a string', () => {
  const request = {
    command: true,
    parameters: ['key', 'value'],
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'Redis request property "command" should be a string.'
  );
});

test('parameters is not an array', () => {
  const request = {
    command: 'set',
    parameters: 'string',
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'Redis request property "parameters" should be an array.'
  );
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be false', async () => {
  expect(checkWrite).toBe(false);
});
