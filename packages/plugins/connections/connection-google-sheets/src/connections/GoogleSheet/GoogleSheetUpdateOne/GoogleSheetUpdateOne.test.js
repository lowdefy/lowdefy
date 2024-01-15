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

const mockGetRows = jest.fn();
const mockAddRow = jest.fn();

const mockSave = jest.fn();

jest.unstable_mockModule('../getSheet', () => {
  return {
    default: () => ({
      addRow: mockAddRow,
      getRows: mockGetRows,
    }),
  };
});

const mockAddRowDefaultImp = (row) => ({ ...row, _sheet: {} });
const mockGetRowsDefaultImp = ({ limit, offset }) => {
  const rows = [
    {
      _rowNumber: 2,
      _rawData: ['1', 'John', '34', '2020/04/26', 'TRUE'],
      id: '1',
      name: 'John',
      age: '34',
      birth_date: '2020/04/26',
      married: 'TRUE',
      _sheet: {},
      save: mockSave,
    },
    {
      _rowNumber: 3,
      _rawData: ['2', 'Steven', '43', '2020/04/27', 'FALSE'],
      id: '2',
      name: 'Steve',
      age: '43',
      birth_date: '2020/04/27',
      married: 'FALSE',
      _sheet: {},
      save: mockSave,
    },
    {
      _rowNumber: 4,
      _rawData: ['3', 'Tim', '34', '2020/04/28', 'FALSE'],
      id: '3',
      name: 'Tim',
      age: '34',
      birth_date: '2020/04/28',
      married: 'FALSE',
      _sheet: {},
      save: mockSave,
    },
    {
      _rowNumber: 5,
      _rawData: ['4', 'Craig', '21', '2020-04-25T22:00:00.000Z', 'TRUE'],
      id: '4',
      name: 'Craig',
      age: '120',
      birth_date: '2020-04-25T22:00:00.000Z',
      married: 'TRUE',
      _sheet: {},
      save: mockSave,
    },
  ];
  return Promise.resolve(rows.slice(offset).slice(undefined, limit));
};

test('googleSheetUpdateOne, match one', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetUpdateOne({
    request: {
      filter: { id: '1' },
      update: {
        name: 'New',
      },
    },
    connection: {},
  });
  expect(res).toEqual({
    modifiedCount: 1,
    row: {
      _rawData: ['1', 'John', '34', '2020/04/26', 'TRUE'],
      _rowNumber: 2,
      age: '34',
      birth_date: '2020/04/26',
      id: '1',
      married: 'TRUE',
      name: 'New',
      save: mockSave,
    },
    upserted: false,
  });
  expect(mockSave.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "raw": undefined,
        },
      ],
    ]
  `);
});

test('googleSheetUpdateOne, match one, raw true', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetUpdateOne({
    request: {
      filter: { id: '1' },
      update: {
        name: 'New',
      },
      options: {
        raw: true,
      },
    },
    connection: {},
  });
  expect(res).toEqual({
    modifiedCount: 1,
    row: {
      _rawData: ['1', 'John', '34', '2020/04/26', 'TRUE'],
      _rowNumber: 2,
      age: '34',
      birth_date: '2020/04/26',
      id: '1',
      married: 'TRUE',
      name: 'New',
      save: mockSave,
    },
    upserted: false,
  });
  expect(mockSave.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "raw": true,
        },
      ],
    ]
  `);
});

test('googleSheetUpdateOne, match nothing', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetUpdateOne({
    request: {
      filter: { id: 'does_not_exist' },
      update: {
        name: 'New',
      },
    },
    connection: {},
  });
  expect(res).toEqual({
    modifiedCount: 0,
    upserted: false,
  });
  expect(mockSave.mock.calls).toMatchInlineSnapshot(`Array []`);
});

test('googleSheetUpdateOne, match nothing, upsert true', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  mockAddRow.mockImplementation(mockAddRowDefaultImp);
  const res = await GoogleSheetUpdateOne({
    request: {
      filter: { id: 'does_not_exist' },
      update: {
        name: 'New',
      },
      options: {
        upsert: true,
      },
    },
    connection: {},
  });
  expect(res).toEqual({
    modifiedCount: 1,
    row: {
      name: 'New',
    },
    upserted: true,
  });
  expect(mockAddRow.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "name": "New",
        },
        Object {
          "raw": undefined,
        },
      ],
    ]
  `);
});

test('googleSheetUpdateOne, match more than one', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetUpdateOne({
    request: {
      filter: { _rowNumber: { $gt: 3 } },
      update: {
        name: 'New',
      },
    },
    connection: {},
  });
  expect(res).toEqual({
    modifiedCount: 1,
    row: {
      _rowNumber: 4,
      _rawData: ['3', 'Tim', '34', '2020/04/28', 'FALSE'],
      id: '3',
      name: 'New',
      age: '34',
      birth_date: '2020/04/28',
      married: 'FALSE',
      save: mockSave,
    },
    upserted: false,
  });
  expect(mockSave.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "raw": undefined,
        },
      ],
    ]
  `);
});

test('valid request schema', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  const schema = GoogleSheetUpdateOne.schema;
  const request = {
    filter: { id: '1' },
    update: {
      name: 'New',
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('request properties is not an object', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  const schema = GoogleSheetUpdateOne.schema;
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetUpdateOne request properties should be an object.'
  );
});

test('filter is not an object', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  const schema = GoogleSheetUpdateOne.schema;
  const request = {
    filter: 'filter',
    update: {
      name: 'New',
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetUpdateOne request property "filter" should be an object.'
  );
});

test('update is not an object', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  const schema = GoogleSheetUpdateOne.schema;
  const request = {
    filter: { id: '1' },
    update: 'update',
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetUpdateOne request property "update" should be an object.'
  );
});

test('filter is missing', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  const schema = GoogleSheetUpdateOne.schema;
  const request = {
    update: {
      name: 'New',
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetUpdateOne request should have required property "filter".'
  );
});

test('update is missing', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  const schema = GoogleSheetUpdateOne.schema;
  const request = {
    filter: { id: '1' },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetUpdateOne request should have required property "update".'
  );
});

test('options.raw is not a boolean', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  const schema = GoogleSheetUpdateOne.schema;
  const request = {
    filter: 'filter',
    update: {
      name: 'New',
    },
    options: {
      raw: 'raw',
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetUpdateOne request property "options.raw" should be a boolean.'
  );
});

test('checkRead should be false', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  const { checkRead } = GoogleSheetUpdateOne.meta;
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  const GoogleSheetUpdateOne = (await import('./GoogleSheetUpdateOne.js')).default;
  const { checkWrite } = GoogleSheetUpdateOne.meta;
  expect(checkWrite).toBe(true);
});
