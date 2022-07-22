/*
  Copyright 2020-2022 Lowdefy, Inc

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

import date from './date.js';

test('_date now', () => {
  const RealDate = Date;
  const constantDate = new Date();
  global.Date = class extends Date {
    constructor() {
      super();
      return constantDate;
    }
  };
  expect(date({ params: 'now' })).toEqual(constantDate);
  expect(date({ params: null, methodName: 'now' })).toEqual(constantDate);
  global.Date = RealDate;
});

test('_date from string', () => {
  expect(date({ params: '2018-01-01T12:00:00.000Z' })).toEqual(
    new Date('2018-01-01T12:00:00.000Z')
  );
});

test('_date short format', () => {
  expect(date({ params: '2018-01-01' })).toEqual(new Date('2018-01-01'));
});

test('_date from unix timestamp', () => {
  expect(date({ params: 1569579992 })).toEqual(new Date(1569579992));
});

test('_date float', () => {
  expect(date({ params: 1.3 })).toEqual(new Date(1.3));
});

test('_date negative int', () => {
  expect(date({ params: -1000 })).toEqual(new Date(-1000));
});

test('_date null', () => {
  expect(() => date({ params: null })).toThrowErrorMatchingInlineSnapshot(
    `"_date.__default accepts one of the following types: number, string."`
  );
});

test('_date invalid operator type', () => {
  expect(() => date({ params: {} })).toThrowErrorMatchingInlineSnapshot(
    `"_date.__default accepts one of the following types: number, string."`
  );
});

test('_date invalid string', () => {
  expect(() => date({ params: 'abc' })).toThrowErrorMatchingInlineSnapshot(
    `"_date.__default - abc could not resolve as a valid javascript date."`
  );
});
