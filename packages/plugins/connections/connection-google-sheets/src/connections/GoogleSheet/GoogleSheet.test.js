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
import GoogleSheet from './GoogleSheet.js';

const schema = GoogleSheet.schema;

test('All requests are present', () => {
  expect(GoogleSheet.requests.GoogleSheetAppendOne).toBeDefined();
  expect(GoogleSheet.requests.GoogleSheetAppendMany).toBeDefined();
  expect(GoogleSheet.requests.GoogleSheetDeleteOne).toBeDefined();
  expect(GoogleSheet.requests.GoogleSheetGetMany).toBeDefined();
  expect(GoogleSheet.requests.GoogleSheetGetOne).toBeDefined();
  expect(GoogleSheet.requests.GoogleSheetUpdateOne).toBeDefined();
  expect(GoogleSheet.requests.GoogleSheetUpdateMany).toBeDefined();
});

test('valid connection schema', () => {
  const connection = {
    apiKey: 'apiKey',
    sheetIndex: 0,
    spreadsheetId: 'spreadsheetId',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('valid connection schema, all properties', () => {
  const connection = {
    apiKey: 'apiKey',
    client_email: 'client_email',
    private_key: 'private_key',
    sheetId: 'sheetId',
    sheetIndex: 0,
    spreadsheetId: 'spreadsheetId',
  };
  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('connection properties is not an object', () => {
  const connection = 'connection';
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleSheet connection properties should be an object.'
  );
});

test('spreadsheetId missing', () => {
  const connection = {};
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleSheet connection should have required property "spreadsheetId".'
  );
});

test('spreadsheetId is not a string', () => {
  const connection = {
    spreadsheetId: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleSheet connection property "spreadsheetId" should be a string.'
  );
});

test('apiKey is not a string', () => {
  const connection = {
    spreadsheetId: 'spreadsheetId',
    apiKey: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleSheet connection property "apiKey" should be a string.'
  );
});

test('client_email is not a string', () => {
  const connection = {
    spreadsheetId: 'spreadsheetId',
    client_email: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleSheet connection property "client_email" should be a string.'
  );
});

test('private_key is not a string', () => {
  const connection = {
    spreadsheetId: 'spreadsheetId',
    private_key: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleSheet connection property "private_key" should be a string.'
  );
});

test('sheetId is not a string', () => {
  const connection = {
    spreadsheetId: 'spreadsheetId',
    sheetId: true,
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleSheet connection property "sheetId" should be a string.'
  );
});

test('sheetIndex is not a number', () => {
  const connection = {
    spreadsheetId: 'spreadsheetId',
    sheetIndex: '',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleSheet connection property "sheetIndex" should be a number.'
  );
});

test('columnTypes is not an object', () => {
  const connection = {
    spreadsheetId: 'spreadsheetId',
    columnTypes: '',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleSheet connection property "columnTypes" should be an object.'
  );
});

test('columnTypes type is invalid', () => {
  const connection = {
    spreadsheetId: 'spreadsheetId',
    columnTypes: {
      column: 'invalid',
    },
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleSheet connection property "/columnTypes/column" should be one of "string", "number", "boolean", "date", or "json".'
  );
});

test('read is not a boolean', () => {
  const connection = {
    spreadsheetId: 'spreadsheetId',
    read: 'read',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleSheet connection property "read" should be a boolean.'
  );
});

test('write is not a boolean', () => {
  const connection = {
    spreadsheetId: 'spreadsheetId',
    write: 'write',
  };
  expect(() => validate({ schema, data: connection })).toThrow(
    'GoogleSheet connection property "write" should be a boolean.'
  );
});
