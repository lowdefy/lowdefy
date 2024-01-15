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
    },
    {
      _rowNumber: 5,
      _rawData: ['4', 'Craig', '21', '2020-04-26T00:00:00.000Z', 'TRUE'],
      id: '4',
      name: 'Craig',
      age: '120',
      birth_date: '2020-04-26T00:00:00.000Z',
      married: 'TRUE',
      _sheet: {},
    },
  ];
  return Promise.resolve(rows.slice(offset).slice(undefined, limit));
};

test('googleSheetGetMany, all rows', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetGetMany({ request: {}, connection: {} });
  expect(res).toEqual([
    {
      _rowNumber: 2,
      _rawData: ['1', 'John', '34', '2020/04/26', 'TRUE'],
      id: '1',
      name: 'John',
      age: '34',
      birth_date: '2020/04/26',
      married: 'TRUE',
    },
    {
      _rowNumber: 3,
      _rawData: ['2', 'Steven', '43', '2020/04/27', 'FALSE'],
      id: '2',
      name: 'Steve',
      age: '43',
      birth_date: '2020/04/27',
      married: 'FALSE',
    },
    {
      _rowNumber: 4,
      _rawData: ['3', 'Tim', '34', '2020/04/28', 'FALSE'],
      id: '3',
      name: 'Tim',
      age: '34',
      birth_date: '2020/04/28',
      married: 'FALSE',
    },
    {
      _rowNumber: 5,
      _rawData: ['4', 'Craig', '21', '2020-04-26T00:00:00.000Z', 'TRUE'],
      id: '4',
      name: 'Craig',
      age: '120',
      birth_date: '2020-04-26T00:00:00.000Z',
      married: 'TRUE',
    },
  ]);
});

test('googleSheetGetMany, empty rows returned', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  mockGetRows.mockImplementation(() => []);
  const res = await GoogleSheetGetMany({ request: {}, connection: {} });
  expect(res).toEqual([]);
});

test('googleSheetGetMany, limit', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetGetMany({ request: { options: { limit: 2 } }, connection: {} });
  expect(res).toEqual([
    {
      _rowNumber: 2,
      _rawData: ['1', 'John', '34', '2020/04/26', 'TRUE'],
      id: '1',
      name: 'John',
      age: '34',
      birth_date: '2020/04/26',
      married: 'TRUE',
    },
    {
      _rowNumber: 3,
      _rawData: ['2', 'Steven', '43', '2020/04/27', 'FALSE'],
      id: '2',
      name: 'Steve',
      age: '43',
      birth_date: '2020/04/27',
      married: 'FALSE',
    },
  ]);
});

test('googleSheetGetMany, skip', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetGetMany({ request: { options: { skip: 2 } }, connection: {} });
  expect(res).toEqual([
    {
      _rowNumber: 4,
      _rawData: ['3', 'Tim', '34', '2020/04/28', 'FALSE'],
      id: '3',
      name: 'Tim',
      age: '34',
      birth_date: '2020/04/28',
      married: 'FALSE',
    },
    {
      _rowNumber: 5,
      _rawData: ['4', 'Craig', '21', '2020-04-26T00:00:00.000Z', 'TRUE'],
      id: '4',
      name: 'Craig',
      age: '120',
      birth_date: '2020-04-26T00:00:00.000Z',
      married: 'TRUE',
    },
  ]);
});

test('googleSheetGetMany, skip and limit', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetGetMany({
    request: { options: { skip: 2, limit: 1 } },
    connection: {},
  });
  expect(res).toEqual([
    {
      _rowNumber: 4,
      _rawData: ['3', 'Tim', '34', '2020/04/28', 'FALSE'],
      id: '3',
      name: 'Tim',
      age: '34',
      birth_date: '2020/04/28',
      married: 'FALSE',
    },
  ]);
});

test('googleSheetGetMany, filter', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetGetMany({ request: { filter: { name: 'Tim' } }, connection: {} });
  expect(res).toEqual([
    {
      _rowNumber: 4,
      _rawData: ['3', 'Tim', '34', '2020/04/28', 'FALSE'],
      id: '3',
      name: 'Tim',
      age: '34',
      birth_date: '2020/04/28',
      married: 'FALSE',
    },
  ]);
});

test('googleSheetGetMany, filter filters all', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetGetMany({ request: { filter: { name: 'Nobody' } }, connection: {} });
  expect(res).toEqual([]);
});

test('googleSheetGetMany, filter _rowNumber', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetGetMany({
    request: { filter: { _rowNumber: { $gt: 3 } } },
    connection: {},
  });
  expect(res).toEqual([
    {
      _rowNumber: 4,
      _rawData: ['3', 'Tim', '34', '2020/04/28', 'FALSE'],
      id: '3',
      name: 'Tim',
      age: '34',
      birth_date: '2020/04/28',
      married: 'FALSE',
    },
    {
      _rowNumber: 5,
      _rawData: ['4', 'Craig', '21', '2020-04-26T00:00:00.000Z', 'TRUE'],
      id: '4',
      name: 'Craig',
      age: '120',
      birth_date: '2020-04-26T00:00:00.000Z',
      married: 'TRUE',
    },
  ]);
});

test('googleSheetGetMany, pipeline count', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetGetMany({
    request: { pipeline: [{ $group: { _id: 0, count: { $sum: 1 } } }] },
    connection: {},
  });
  expect(res).toEqual([
    {
      _id: 0,
      count: 4,
    },
  ]);
});

test('googleSheetGetMany, columnTypes', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetGetMany({
    request: {},
    connection: {
      columnTypes: {
        name: 'string',
        age: 'number',
        married: 'boolean',
        birth_date: 'date',
      },
    },
  });
  expect(res).toEqual([
    {
      _rowNumber: 2,
      _rawData: ['1', 'John', '34', '2020/04/26', 'TRUE'],
      id: '1',
      name: 'John',
      age: 34,
      birth_date: new Date('2020-04-26T00:00:00.000Z'),
      married: true,
    },
    {
      _rowNumber: 3,
      _rawData: ['2', 'Steven', '43', '2020/04/27', 'FALSE'],
      id: '2',
      name: 'Steve',
      age: 43,
      birth_date: new Date('2020-04-27T00:00:00.000Z'),
      married: false,
    },
    {
      _rowNumber: 4,
      _rawData: ['3', 'Tim', '34', '2020/04/28', 'FALSE'],
      id: '3',
      name: 'Tim',
      age: 34,
      birth_date: new Date('2020-04-28T00:00:00.000Z'),
      married: false,
    },
    {
      _rowNumber: 5,
      _rawData: ['4', 'Craig', '21', '2020-04-26T00:00:00.000Z', 'TRUE'],
      id: '4',
      name: 'Craig',
      age: 120,
      birth_date: new Date('2020-04-26T00:00:00.000Z'),
      married: true,
    },
  ]);
});

test('valid request schema', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  const schema = GoogleSheetGetMany.schema;
  const request = {};
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('valid request schema, all properties', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  const schema = GoogleSheetGetMany.schema;
  const request = {
    filter: { id: 1 },
    pipeline: [{ $addFields: { a: 1 } }],
    options: {
      limit: 100,
      skip: 300,
    },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('request properties is not an object', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  const schema = GoogleSheetGetMany.schema;
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetGetMany request properties should be an object.'
  );
});

test('limit is not a number', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  const schema = GoogleSheetGetMany.schema;
  const request = {
    options: {
      limit: true,
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetGetMany request property "options.limit" should be a number.'
  );
});

test('skip is not a number', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  const schema = GoogleSheetGetMany.schema;
  const request = {
    options: {
      skip: true,
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetGetMany request property "options.skip" should be a number.'
  );
});

test('filter is not an object', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  const schema = GoogleSheetGetMany.schema;
  const request = {
    filter: true,
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetGetMany request property "filter" should be an object.'
  );
});

test('pipeline is not an array', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  const schema = GoogleSheetGetMany.schema;
  const request = {
    pipeline: true,
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetGetMany request property "pipeline" should be an array.'
  );
});

test('checkRead should be true', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  const { checkRead } = GoogleSheetGetMany.meta;
  expect(checkRead).toBe(true);
});

test('checkWrite should be false', async () => {
  const GoogleSheetGetMany = (await import('./GoogleSheetGetMany.js')).default;
  const { checkWrite } = GoogleSheetGetMany.meta;
  expect(checkWrite).toBe(false);
});
