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
import GoogleSheetAppendMany from './GoogleSheetAppendMany';

const mockAddRows = jest.fn();
jest.mock('../getSheet', () => () => ({
  addRows: mockAddRows,
}));

const { resolver, schema, checkRead, checkWrite } = GoogleSheetAppendMany;
const mockAddRowsDefaultImp = (rows) => rows.map((row) => ({ ...row, _sheet: {} }));

test('googleSheetAppendMany, one row', async () => {
  mockAddRows.mockImplementation(mockAddRowsDefaultImp);
  const res = await resolver({
    request: {
      rows: [{ id: '1', name: 'John', age: '34', birth_date: '2020/04/26', married: 'TRUE' }],
    },
    connection: {},
  });
  expect(res).toEqual({ insertedCount: 1 });
  expect(mockAddRows.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Array [
          Object {
            "age": "34",
            "birth_date": "2020/04/26",
            "id": "1",
            "married": "TRUE",
            "name": "John",
          },
        ],
        Object {
          "raw": undefined,
        },
      ],
    ]
  `);
});

test('googleSheetAppendMany, two rows', async () => {
  mockAddRows.mockImplementation(mockAddRowsDefaultImp);
  const res = await resolver({
    request: {
      rows: [
        { id: '1', name: 'John', age: '34', birth_date: '2020/04/26', married: 'TRUE' },
        { id: '2', name: 'Peter', age: '34', birth_date: '2020/04/26', married: 'TRUE' },
      ],
    },
    connection: {},
  });
  expect(res).toEqual({ insertedCount: 2 });
  expect(mockAddRows.mock.calls).toMatchInlineSnapshot(`
    Array [
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
            "age": "34",
            "birth_date": "2020/04/26",
            "id": "2",
            "married": "TRUE",
            "name": "Peter",
          },
        ],
        Object {
          "raw": undefined,
        },
      ],
    ]
  `);
});

test('googleSheetAppendMany, rows empty array', async () => {
  mockAddRows.mockImplementation(mockAddRowsDefaultImp);
  const res = await resolver({
    request: {
      rows: [],
    },
    connection: {},
  });
  expect(res).toEqual({ insertedCount: 0 });
  expect(mockAddRows.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Array [],
        Object {
          "raw": undefined,
        },
      ],
    ]
  `);
});

test('googleSheetAppendMany, transform types', async () => {
  mockAddRows.mockImplementation(mockAddRowsDefaultImp);
  const res = await resolver({
    request: {
      rows: [
        {
          id: '1',
          name: 'John',
          age: 34,
          birth_date: new Date('2020-04-26T00:00:00.000Z'),
          married: true,
        },
      ],
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
  expect(res).toEqual({ insertedCount: 1 });
  expect(mockAddRows.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Array [
          Object {
            "age": "34",
            "birth_date": "2020-04-26T00:00:00.000Z",
            "id": "1",
            "married": "TRUE",
            "name": "John",
          },
        ],
        Object {
          "raw": undefined,
        },
      ],
    ]
  `);
});

test('googleSheetAppendMany, one row, raw true', async () => {
  mockAddRows.mockImplementation(mockAddRowsDefaultImp);
  const res = await resolver({
    request: {
      rows: [{ id: '1', name: 'John', age: '34', birth_date: '2020/04/26', married: 'TRUE' }],
      options: {
        raw: true,
      },
    },
    connection: {},
  });
  expect(res).toEqual({ insertedCount: 1 });
  expect(mockAddRows.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Array [
          Object {
            "age": "34",
            "birth_date": "2020/04/26",
            "id": "1",
            "married": "TRUE",
            "name": "John",
          },
        ],
        Object {
          "raw": true,
        },
      ],
    ]
  `);
});

test('valid request schema', () => {
  const request = {
    rows: [
      {
        name: 'name',
      },
    ],
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request schema, all options', () => {
  const request = {
    rows: [
      {
        name: 'name',
      },
    ],
    options: {
      raw: true,
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('request properties is not an object', () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetAppendMany request properties should be an object.'
  );
});

test('rows is not an array', () => {
  const request = {
    rows: true,
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetAppendMany request property "rows" should be an array.'
  );
});

test('rows is not an array of objects', () => {
  const request = {
    rows: [1, 2, 3],
  };
  // Gives an error message for each item in array
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetAppendMany request property "rows" should be an array of objects.; GoogleSheetAppendMany request property "rows" should be an array of objects.'
  );
});

test('rows is missing', () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetAppendMany request should have required property "rows".'
  );
});

test('raw is not a boolean', () => {
  const request = {
    rows: [
      {
        name: 'name',
      },
    ],
    options: {
      raw: 'raw',
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetAppendMany request property "options.raw" should be a boolean.'
  );
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  expect(checkWrite).toBe(true);
});
