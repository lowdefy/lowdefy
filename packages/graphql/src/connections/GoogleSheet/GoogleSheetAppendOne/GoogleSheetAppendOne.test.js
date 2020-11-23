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

import GoogleSheetAppendOne from './GoogleSheetAppendOne';
import { ConfigurationError } from '../../../context/errors';
import testSchema from '../../../utils/testSchema';

const mockAddRow = jest.fn();
jest.mock('../getSheet', () => () => ({
  addRow: mockAddRow,
}));

const { resolver, schema, checkRead, checkWrite } = GoogleSheetAppendOne;
const mockAddRowDefaultImp = (row) => ({ ...row, _sheet: {} });

test('googleSheetAppendOne', async () => {
  mockAddRow.mockImplementation(mockAddRowDefaultImp);
  const res = await resolver({
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
});

test('googleSheetAppendOne, transform types', async () => {
  mockAddRow.mockImplementation(mockAddRowDefaultImp);
  const res = await resolver({
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
});

test('valid request schema', () => {
  const request = {
    row: {
      name: 'name',
    },
  };
  expect(testSchema({ schema, object: request })).toBe(true);
});

test('valid request schema, all options', () => {
  const request = {
    row: {
      name: 'name',
    },
    options: {
      raw: true,
    },
  };
  expect(testSchema({ schema, object: request })).toBe(true);
});

test('request properties is not an object', () => {
  const request = 'request';
  expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  expect(() => testSchema({ schema, object: request })).toThrow(
    'GoogleSheetAppendOne request properties should be an object.'
  );
});

test('row is not an object', () => {
  const request = {
    row: true,
  };
  expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  expect(() => testSchema({ schema, object: request })).toThrow(
    'GoogleSheetAppendOne request property "row" should be an object.'
  );
});

test('row is missing', () => {
  const request = {};
  expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  expect(() => testSchema({ schema, object: request })).toThrow(
    'GoogleSheetAppendOne request should have required property "row".'
  );
});

test('raw is not a boolean', () => {
  const request = {
    row: {
      name: 'name',
    },
    options: {
      raw: 'raw',
    },
  };
  expect(() => testSchema({ schema, object: request })).toThrow(ConfigurationError);
  expect(() => testSchema({ schema, object: request })).toThrow(
    'GoogleSheetAppendOne request property "options.raw" should be a boolean.'
  );
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  expect(checkWrite).toBe(true);
});
