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
import Mcp from './Mcp.js';

test('Mcp.create returns connection properties as-is', () => {
  const result = Mcp.create({
    connection: { url: 'https://example.com/mcp', transport: 'http' },
  });
  expect(result).toEqual({ url: 'https://example.com/mcp', transport: 'http' });
});

test('Mcp.create returns all connection properties for stdio transport', () => {
  const result = Mcp.create({
    connection: { transport: 'stdio', command: 'node', args: ['server.js'], env: { FOO: 'bar' } },
  });
  expect(result).toEqual({
    transport: 'stdio',
    command: 'node',
    args: ['server.js'],
    env: { FOO: 'bar' },
  });
});

test('Mcp.create returns empty object for null connection', () => {
  expect(Mcp.create({ connection: null })).toEqual({});
});

test('Mcp.create returns empty object for undefined connection', () => {
  expect(Mcp.create({ connection: undefined })).toEqual({});
});

test('Mcp.schema is defined', () => {
  expect(Mcp.schema).toBeDefined();
  expect(Mcp.schema.type).toBe('object');
});

test('valid connection schema with url and transport', () => {
  const connection = { url: 'https://example.com/mcp', transport: 'http' };
  expect(validate({ schema: Mcp.schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema with all http properties', () => {
  const connection = {
    url: 'https://example.com/mcp',
    transport: 'http',
    headers: { Authorization: 'Bearer token' },
  };
  expect(validate({ schema: Mcp.schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema with stdio properties', () => {
  const connection = {
    transport: 'stdio',
    command: 'node',
    args: ['server.js'],
    env: { NODE_ENV: 'production' },
  };
  expect(validate({ schema: Mcp.schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema with sse transport', () => {
  const connection = { url: 'https://example.com/sse', transport: 'sse' };
  expect(validate({ schema: Mcp.schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema with empty object', () => {
  expect(validate({ schema: Mcp.schema, data: {} })).toEqual({ valid: true });
});

test('connection properties is not an object', () => {
  expect(() => validate({ schema: Mcp.schema, data: 'connection' })).toThrow(
    'Mcp connection properties should be an object.'
  );
});

test('url is not a string', () => {
  expect(() => validate({ schema: Mcp.schema, data: { url: 123 } })).toThrow(
    'Mcp connection property "url" should be a string.'
  );
});

test('transport is not a valid enum value', () => {
  expect(() => validate({ schema: Mcp.schema, data: { transport: 'websocket' } })).toThrow(
    'Mcp connection property "transport" should be one of "http", "sse", or "stdio".'
  );
});

test('headers is not an object', () => {
  expect(() => validate({ schema: Mcp.schema, data: { headers: 'invalid' } })).toThrow(
    'Mcp connection property "headers" should be an object.'
  );
});

test('command is not a string', () => {
  expect(() => validate({ schema: Mcp.schema, data: { command: 123 } })).toThrow(
    'Mcp connection property "command" should be a string.'
  );
});

test('args is not an array', () => {
  expect(() => validate({ schema: Mcp.schema, data: { args: 'invalid' } })).toThrow(
    'Mcp connection property "args" should be an array of strings.'
  );
});

test('env is not an object', () => {
  expect(() => validate({ schema: Mcp.schema, data: { env: 'invalid' } })).toThrow(
    'Mcp connection property "env" should be an object.'
  );
});
