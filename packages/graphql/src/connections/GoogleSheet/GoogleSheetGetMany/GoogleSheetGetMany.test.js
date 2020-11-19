/*
  Copyright 2020 Lowdefy, Inc

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

import GoogleSheetGetMany from './GoogleSheetGetMany';
import { ConfigurationError } from '../../../context/errors';
import testSchema from '../../../utils/testSchema';

const mockGetRows = jest.fn();
jest.mock('../getSheet', () => () => ({
  getRows: mockGetRows,
}));

const { resolver, schema } = GoogleSheetGetMany;
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
      _rawData: ['4', 'Craig', '21', '2020-04-25T22:00:00.000Z', 'TRUE'],
      id: '4',
      name: 'Craig',
      age: '120',
      birth_date: '2020-04-25T22:00:00.000Z',
      married: 'TRUE',
      _sheet: {},
    },
  ];
  return Promise.resolve(rows.slice(offset).slice(undefined, limit));
};

test('googleSheetGetMany, all rows', async () => {
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await resolver({ request: {}, connection: {} });
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
      _rawData: ['4', 'Craig', '21', '2020-04-25T22:00:00.000Z', 'TRUE'],
      id: '4',
      name: 'Craig',
      age: '120',
      birth_date: '2020-04-25T22:00:00.000Z',
      married: 'TRUE',
    },
  ]);
});

test('googleSheetGetMany, empty rows returned', async () => {
  mockGetRows.mockImplementation(() => []);
  const res = await resolver({ request: {}, connection: {} });
  expect(res).toEqual([]);
});

test('googleSheetGetMany, limit', async () => {
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await resolver({ request: { limit: 2 }, connection: {} });
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

test('googleSheetGetMany, offset', async () => {
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await resolver({ request: { offset: 2 }, connection: {} });
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
      _rawData: ['4', 'Craig', '21', '2020-04-25T22:00:00.000Z', 'TRUE'],
      id: '4',
      name: 'Craig',
      age: '120',
      birth_date: '2020-04-25T22:00:00.000Z',
      married: 'TRUE',
    },
  ]);
});

test('googleSheetGetMany, offset and limit', async () => {
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await resolver({ request: { offset: 2, limit: 1 }, connection: {} });
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
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await resolver({ request: { filter: { name: 'Tim' } }, connection: {} });
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
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await resolver({ request: { filter: { name: 'Nobody' } }, connection: {} });
  expect(res).toEqual([]);
});

test('googleSheetGetMany, filter _rowNumber', async () => {
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await resolver({ request: { filter: { _rowNumber: { $gt: 3 } } }, connection: {} });
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
      _rawData: ['4', 'Craig', '21', '2020-04-25T22:00:00.000Z', 'TRUE'],
      id: '4',
      name: 'Craig',
      age: '120',
      birth_date: '2020-04-25T22:00:00.000Z',
      married: 'TRUE',
    },
  ]);
});

test('googleSheetGetMany, pipeline count', async () => {
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await resolver({
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
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await resolver({
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
      birth_date: new Date('2020/04/26'),
      married: true,
    },
    {
      _rowNumber: 3,
      _rawData: ['2', 'Steven', '43', '2020/04/27', 'FALSE'],
      id: '2',
      name: 'Steve',
      age: 43,
      birth_date: new Date('2020/04/27'),
      married: false,
    },
    {
      _rowNumber: 4,
      _rawData: ['3', 'Tim', '34', '2020/04/28', 'FALSE'],
      id: '3',
      name: 'Tim',
      age: 34,
      birth_date: new Date('2020/04/28'),
      married: false,
    },
    {
      _rowNumber: 5,
      _rawData: ['4', 'Craig', '21', '2020-04-25T22:00:00.000Z', 'TRUE'],
      id: '4',
      name: 'Craig',
      age: 120,
      birth_date: new Date('2020-04-25T22:00:00.000Z'),
      married: true,
    },
  ]);
});

test('valid request schema', () => {
  const request = {};
  expect(testSchema({ schema, object: request })).toBe(true);
});

test('valid request schema, all properties', () => {
  const request = {
    limit: 100,
    offset: 300,
  };
  expect(testSchema({ schema, object: request })).toBe(true);
});

test('request properties is not an object', () => {
  const request = 'request';
  expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  expect(() => testSchema({ schema, object: request })).toThrow(
    'GoogleSheetGetMany request properties should be an object.'
  );
});

test('limit is not a number', () => {
  const request = {
    limit: true,
  };
  expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  expect(() => testSchema({ schema, object: request })).toThrow(
    'GoogleSheetGetMany request property "limit" should be a number.'
  );
});

test('offset is not a number', () => {
  const request = {
    offset: true,
  };
  expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  expect(() => testSchema({ schema, object: request })).toThrow(
    'GoogleSheetGetMany request property "offset" should be a number.'
  );
});

test('filter is not an object', () => {
  const request = {
    filter: true,
  };
  expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  expect(() => testSchema({ schema, object: request })).toThrow(
    'GoogleSheetGetMany request property "filter" should be an object.'
  );
});

test('pipeline is not an array', () => {
  const request = {
    pipeline: true,
  };
  expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  expect(() => testSchema({ schema, object: request })).toThrow(
    'GoogleSheetGetMany request property "pipeline" should be an array.'
  );
});
