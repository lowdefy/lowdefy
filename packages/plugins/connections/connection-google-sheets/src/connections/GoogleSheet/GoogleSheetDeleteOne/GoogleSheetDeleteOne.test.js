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
const mockDelete = jest.fn();

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
      delete: mockDelete,
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
      delete: mockDelete,
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
      delete: mockDelete,
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
      delete: mockDelete,
    },
  ];
  return Promise.resolve(rows.slice(offset).slice(undefined, limit));
};

test('googleSheetDeleteMany, match one', async () => {
  const GoogleSheetDeleteOne = (await import('./GoogleSheetDeleteOne.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetDeleteOne({
    request: {
      filter: { id: '1' },
    },
    connection: {},
  });
  expect(res).toEqual({
    deletedCount: 1,
    row: {
      _rowNumber: 2,
      _rawData: ['1', 'John', '34', '2020/04/26', 'TRUE'],
      id: '1',
      name: 'John',
      age: '34',
      birth_date: '2020/04/26',
      married: 'TRUE',
      delete: mockDelete,
    },
  });
  expect(mockDelete).toHaveBeenCalledTimes(1);
});

test('googleSheetDeleteMany, match nothing', async () => {
  const GoogleSheetDeleteOne = (await import('./GoogleSheetDeleteOne.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetDeleteOne({
    request: {
      filter: { id: 'does_not_exist' },
    },
    connection: {},
  });
  expect(res).toEqual({
    deletedCount: 0,
  });
  expect(mockDelete).toHaveBeenCalledTimes(0);
});

test('googleSheetDeleteMany, match more than one', async () => {
  const GoogleSheetDeleteOne = (await import('./GoogleSheetDeleteOne.js')).default;
  mockGetRows.mockImplementation(mockGetRowsDefaultImp);
  const res = await GoogleSheetDeleteOne({
    request: {
      filter: { _rowNumber: { $gt: 3 } },
    },
    connection: {},
  });
  expect(res).toEqual({
    deletedCount: 1,
    row: {
      _rawData: ['3', 'Tim', '34', '2020/04/28', 'FALSE'],
      _rowNumber: 4,
      age: '34',
      birth_date: '2020/04/28',
      delete: mockDelete,
      id: '3',
      married: 'FALSE',
      name: 'Tim',
    },
  });
  expect(mockDelete).toHaveBeenCalledTimes(1);
});

test('valid request schema', async () => {
  const GoogleSheetDeleteOne = (await import('./GoogleSheetDeleteOne.js')).default;
  const schema = GoogleSheetDeleteOne.schema;
  const request = {
    filter: { id: '1' },
  };
  expect(validate({ schema, data: request })).toEqual({ valid: true });
});

test('request properties is not an object', async () => {
  const GoogleSheetDeleteOne = (await import('./GoogleSheetDeleteOne.js')).default;
  const schema = GoogleSheetDeleteOne.schema;
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetDeleteOne request properties should be an object.'
  );
});

test('filter is not an object', async () => {
  const GoogleSheetDeleteOne = (await import('./GoogleSheetDeleteOne.js')).default;
  const schema = GoogleSheetDeleteOne.schema;
  const request = {
    filter: true,
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetDeleteOne request property "filter" should be an object.'
  );
});

test('filter is missing', async () => {
  const GoogleSheetDeleteOne = (await import('./GoogleSheetDeleteOne.js')).default;
  const schema = GoogleSheetDeleteOne.schema;
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetDeleteOne request should have required property "filter".'
  );
});

test('limit is not a number', async () => {
  const GoogleSheetDeleteOne = (await import('./GoogleSheetDeleteOne.js')).default;
  const schema = GoogleSheetDeleteOne.schema;
  const request = {
    options: {
      limit: true,
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetDeleteOne request property "options.limit" should be a number.'
  );
});

test('skip is not a number', async () => {
  const GoogleSheetDeleteOne = (await import('./GoogleSheetDeleteOne.js')).default;
  const schema = GoogleSheetDeleteOne.schema;
  const request = {
    options: {
      skip: true,
    },
  };
  expect(() => validate({ schema, data: request })).toThrow(
    'GoogleSheetDeleteOne request property "options.skip" should be a number.'
  );
});

test('checkRead should be false', async () => {
  const GoogleSheetDeleteOne = (await import('./GoogleSheetDeleteOne.js')).default;
  const { checkRead } = GoogleSheetDeleteOne.meta;
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  const GoogleSheetDeleteOne = (await import('./GoogleSheetDeleteOne.js')).default;
  const { checkWrite } = GoogleSheetDeleteOne.meta;
  expect(checkWrite).toBe(true);
});
