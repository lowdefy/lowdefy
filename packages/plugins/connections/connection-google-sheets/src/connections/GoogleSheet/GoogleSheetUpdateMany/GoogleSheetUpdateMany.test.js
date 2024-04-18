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
const mockSave = jest.fn();

jest.unstable_mockModule('../getSheet', () => {
  return {
    default: () => ({
      getRows: mockGetRows,
    }),
  };
});

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

test('googleSheetUpdateMany, match one', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetUpdateMany({
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

test('googleSheetUpdateMany, match one, raw true', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetUpdateMany({
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

test('googleSheetUpdateMany, match nothing', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetUpdateMany({
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
  });
  expect(mockSave.mock.calls).toMatchInlineSnapshot(`Array []`);
});

test('googleSheetUpdateMany, match more than one', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetUpdateMany({
    request: {
      filter: { _rowNumber: { $gt: 3 } },
      update: {
        name: 'New',
      },
    },
    connection: {},
  });
  expect(res).toEqual({
    modifiedCount: 2,
  });
  expect(mockSave.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "raw": undefined,
        },
      ],
      Array [
        Object {
          "raw": undefined,
        },
      ],
    ]
  `);
});

test('valid request schema', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  const schema = GoogleSheetUpdateMany.schema;
  const request = {
    filter: { id: '1' },
    update: {
      name: 'New',
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('request properties is not an object', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  const schema = GoogleSheetUpdateMany.schema;
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetUpdateMany request properties should be an object.'
  );
});

test('filter is not an object', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  const schema = GoogleSheetUpdateMany.schema;
  const request = {
    filter: 'filter',
    update: {
      name: 'New',
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetUpdateMany request property "filter" should be an object.'
  );
});

test('update is not an object', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  const schema = GoogleSheetUpdateMany.schema;
  const request = {
    filter: { id: '1' },
    update: 'update',
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetUpdateMany request property "update" should be an object.'
  );
});

test('filter is missing', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  const schema = GoogleSheetUpdateMany.schema;
  const request = {
    update: {
      name: 'New',
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetUpdateMany request should have required property "filter".'
  );
});

test('update is missing', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  const schema = GoogleSheetUpdateMany.schema;
  const request = {
    filter: { id: '1' },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetUpdateMany request should have required property "update".'
  );
});

test('options.raw is not a boolean', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  const schema = GoogleSheetUpdateMany.schema;
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
    'GoogleSheetUpdateMany request property "options.raw" should be a boolean.'
  );
});

test('checkRead should be false', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  const { checkRead } = GoogleSheetUpdateMany.meta;
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  const GoogleSheetUpdateMany = (await import('./GoogleSheetUpdateMany.js')).default;
  const { checkWrite } = GoogleSheetUpdateMany.meta;
  expect(checkWrite).toBe(true);
});
