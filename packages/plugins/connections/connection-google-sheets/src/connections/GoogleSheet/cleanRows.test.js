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

import cleanRows from './cleanRows.js';

test('cleanRows removes objects with key _sheet from an array of rows', () => {
  expect(
    cleanRows([
      {
        id: 1,
        value: 'a',
        _sheet: {
          string: 'string',
        },
      },
      {
        id: 2,
        value: 'b',
        _sheet: {
          string: 'string',
        },
      },
    ])
  ).toEqual([
    {
      id: 1,
      value: 'a',
    },
    {
      id: 2,
      value: 'b',
    },
  ]);
});

test('cleanRows removes objects with key _sheet from a row', () => {
  expect(
    cleanRows({
      id: 1,
      value: 'a',
      _sheet: {
        string: 'string',
      },
    })
  ).toEqual({
    id: 1,
    value: 'a',
  });
});

test('cleanRows invalid input', () => {
  expect(() => cleanRows(1)).toThrow('cleanRows received invalid input type number.');
});
