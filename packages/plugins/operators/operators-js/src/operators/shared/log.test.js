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

/* eslint-disable max-classes-per-file */
import { jest } from '@jest/globals';
import _log from './log.js';

const location = 'location';

const logger = console.log;
const mockLogger = jest.fn();
beforeEach(() => {
  console.log = mockLogger;
  mockLogger.mockReset();
});
afterAll(() => {
  console.log = logger;
});

test('_log a string', () => {
  expect(_log({ params: 'value', location })).toEqual('value');
  expect(mockLogger).toHaveBeenCalledWith('value');
});
test('_log a number', () => {
  expect(_log({ params: 1, location })).toEqual(1);
  expect(mockLogger).toHaveBeenCalledWith(1);
});
test('_log a null', () => {
  expect(_log({ params: null, location })).toEqual(null);
  expect(mockLogger).toHaveBeenCalledWith(null);
});
// TODO: Confirm if this is expected behaviour??
test('_log an undefined', () => {
  expect(_log({ params: undefined, location })).toEqual(undefined);
  expect(mockLogger).toHaveBeenCalledWith(undefined);
});
test('_log a 0', () => {
  expect(_log({ params: 0, location })).toEqual(0);
  expect(mockLogger).toHaveBeenCalledWith(0);
});
test('_log a false', () => {
  expect(_log({ params: false, location })).toEqual(false);
  expect(mockLogger).toHaveBeenCalledWith(false);
});
test('_log an object', () => {
  expect(_log({ params: { b: 1 }, location })).toEqual({ b: 1 });
  expect(mockLogger).toHaveBeenCalledWith({ b: 1 });
});
test('_log an array', () => {
  expect(_log({ params: [{ b: 1 }], location })).toEqual([{ b: 1 }]);
  expect(mockLogger).toHaveBeenCalledWith([{ b: 1 }]);
});
