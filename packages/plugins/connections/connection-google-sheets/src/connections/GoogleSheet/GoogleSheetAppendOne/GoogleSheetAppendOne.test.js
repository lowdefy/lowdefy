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
import { validate } from '@lowdefy/ajv';

const mockAddRow = jest.fn();

jest.unstable_mockModule('../getSheet', () => {
  return {
    default: () => ({
      addRow: mockAddRow,
    }),
  };
});

const mockAddRowDefaultImp = (row) => ({ ...row, _sheet: {} });

test('googleSheetAppendOne', async () => {
  const GoogleSheetAppendOne = (await import('./GoogleSheetAppendOne.js')).default;
  mockAddRow.mockImplementation(mockAddRowDefaultImp);
  const res = await GoogleSheetAppendOne({
    request: {
      row: { id: '1', name: 'John', age: '34', birth_date: '2020/04/26', married: 'TRUE' },
    },
    connection: {},
  });
  expect(res).toEqual({
    insertedCount: 1,
    row: {
      id: '1',
      name: 'John',
      age: '34',
      birth_date: '2020/04/26',
      married: 'TRUE',
    },
  });
  expect(mockAddRow.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "age": "34",
          "birth_date": "2020/04/26",
          "id": "1",
          "married": "TRUE",
          "name": "John",
        },
        Object {
          "raw": undefined,
        },
      ],
    ]
  `);
});

test('googleSheetAppendOne, transform types', async () => {
  const GoogleSheetAppendOne = (await import('./GoogleSheetAppendOne.js')).default;
  mockAddRow.mockImplementation(mockAddRowDefaultImp);
  const res = await GoogleSheetAppendOne({
    request: {
      row: {
        id: '1',
        name: 'John',
        age: 34,
        birth_date: new Date('2020-04-26T00:00:00.000Z'),
        married: true,
      },
    },
    connection: {
      columnTypes: {
        name: 'string',
        age: 'number',
        married: 'boolean',
        birth_date: 'date',
      },
    },
  });
  expect(res).toEqual({
    insertedCount: 1,
    row: {
      id: '1',
      name: 'John',
      age: '34',
      birth_date: '2020-04-26T00:00:00.000Z',
      married: 'TRUE',
    },
  });
  expect(mockAddRow.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "age": "34",
          "birth_date": "2020-04-26T00:00:00.000Z",
          "id": "1",
          "married": "TRUE",
          "name": "John",
        },
        Object {
          "raw": undefined,
        },
      ],
    ]
  `);
});

test('googleSheetAppendOne, raw true', async () => {
  const GoogleSheetAppendOne = (await import('./GoogleSheetAppendOne.js')).default;
  mockAddRow.mockImplementation(mockAddRowDefaultImp);
  const res = await GoogleSheetAppendOne({
    request: {
      row: { id: '1', name: 'John', age: '34', birth_date: '2020/04/26', married: 'TRUE' },
      options: {
        raw: true,
      },
    },
    connection: {},
  });
  expect(res).toEqual({
    insertedCount: 1,
    row: {
      id: '1',
      name: 'John',
      age: '34',
      birth_date: '2020/04/26',
      married: 'TRUE',
    },
  });
  expect(mockAddRow.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "age": "34",
          "birth_date": "2020/04/26",
          "id": "1",
          "married": "TRUE",
          "name": "John",
        },
        Object {
          "raw": true,
        },
      ],
    ]
  `);
});

test('valid request schema', async () => {
  const GoogleSheetAppendOne = (await import('./GoogleSheetAppendOne.js')).default;
  const schema = GoogleSheetAppendOne.schema;
  const request = {
    row: {
      name: 'name',
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request schema, all options', async () => {
  const GoogleSheetAppendOne = (await import('./GoogleSheetAppendOne.js')).default;
  const schema = GoogleSheetAppendOne.schema;
  const request = {
    row: {
      name: 'name',
    },
    options: {
      raw: true,
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('request properties is not an object', async () => {
  const GoogleSheetAppendOne = (await import('./GoogleSheetAppendOne.js')).default;
  const schema = GoogleSheetAppendOne.schema;
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetAppendOne request properties should be an object.'
  );
});

test('row is not an object', async () => {
  const GoogleSheetAppendOne = (await import('./GoogleSheetAppendOne.js')).default;
  const schema = GoogleSheetAppendOne.schema;
  const request = {
    row: true,
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetAppendOne request property "row" should be an object.'
  );
});

test('row is missing', async () => {
  const GoogleSheetAppendOne = (await import('./GoogleSheetAppendOne.js')).default;
  const schema = GoogleSheetAppendOne.schema;
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetAppendOne request should have required property "row".'
  );
});

test('raw is not a boolean', async () => {
  const GoogleSheetAppendOne = (await import('./GoogleSheetAppendOne.js')).default;
  const schema = GoogleSheetAppendOne.schema;
  const request = {
    row: {
      name: 'name',
    },
    options: {
      raw: 'raw',
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetAppendOne request property "options.raw" should be a boolean.'
  );
});

test('checkRead should be false', async () => {
  const GoogleSheetAppendOne = (await import('./GoogleSheetAppendOne.js')).default;
  const { checkRead } = GoogleSheetAppendOne.meta;
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  const GoogleSheetAppendOne = (await import('./GoogleSheetAppendOne.js')).default;
  const { checkWrite } = GoogleSheetAppendOne.meta;
  expect(checkWrite).toBe(true);
});
