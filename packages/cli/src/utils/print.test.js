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

import createPrint from './print';

const mockConsoleLog = jest.fn();
const mockGetHours = jest.fn();
const mockGetMinutes = jest.fn();
const mockGetSeconds = jest.fn();
// const realLog = console.log;
// const realNow = Date.now;
console.log = mockConsoleLog;
// eslint-disable-next-line no-global-assign
Date = jest.fn(() => ({
  getHours: mockGetHours,
  getMinutes: mockGetMinutes,
  getSeconds: mockGetSeconds,
}));

Date.now = () => {};

beforeEach(() => {
  mockConsoleLog.mockReset();
  mockGetHours.mockReset();
  mockGetMinutes.mockReset();
  mockGetSeconds.mockReset();
});

// afterAll(() => {
//   console.log = realLog;
//   Date.now = realNow;
// });

test('create print', () => {
  const print = createPrint();
  expect(print).toMatchInlineSnapshot(`
    Object {
      "error": [Function],
      "info": [Function],
      "log": [Function],
      "warn": [Function],
    }
  `);
});

test('print info', () => {
  const print = createPrint();
  print.info('Test info');
  expect(mockConsoleLog.mock.calls).toEqual([['[34mTest info[39m']]);
});

test('print log', () => {
  const print = createPrint();
  print.log('Test log');
  expect(mockConsoleLog.mock.calls).toEqual([['[32mTest log[39m']]);
});

test('print warn', () => {
  const print = createPrint();
  print.warn('Test warn');
  expect(mockConsoleLog.mock.calls).toEqual([['[33mTest warn[39m']]);
});

test('print error', () => {
  const print = createPrint();
  print.error('Test error');
  expect(mockConsoleLog.mock.calls).toEqual([['[31mTest error[39m']]);
});

test('print info with timestamp, less than 10', () => {
  mockGetHours.mockImplementation(() => 1);
  mockGetMinutes.mockImplementation(() => 2);
  mockGetSeconds.mockImplementation(() => 3);
  const print = createPrint({ timestamp: true });
  print.info('Test info');
  expect(mockConsoleLog.mock.calls).toEqual([['[2m01:02:03[22m - [34mTest info[39m']]);
});

test('print log with timestamp, less than 10', () => {
  mockGetHours.mockImplementation(() => 1);
  mockGetMinutes.mockImplementation(() => 2);
  mockGetSeconds.mockImplementation(() => 3);
  const print = createPrint({ timestamp: true });
  print.log('Test log');
  expect(mockConsoleLog.mock.calls).toEqual([['[2m01:02:03[22m - [32mTest log[39m']]);
});

test('print warn with timestamp, less than 10', () => {
  mockGetHours.mockImplementation(() => 1);
  mockGetMinutes.mockImplementation(() => 2);
  mockGetSeconds.mockImplementation(() => 3);
  const print = createPrint({ timestamp: true });
  print.warn('Test warn');
  expect(mockConsoleLog.mock.calls).toEqual([['[2m01:02:03[22m - [33mTest warn[39m']]);
});

test('print error with timestamp, less than 10', () => {
  mockGetHours.mockImplementation(() => 1);
  mockGetMinutes.mockImplementation(() => 2);
  mockGetSeconds.mockImplementation(() => 3);
  const print = createPrint({ timestamp: true });
  print.error('Test error');
  expect(mockConsoleLog.mock.calls).toEqual([['[2m01:02:03[22m - [31mTest error[39m']]);
});

test('print info with timestamp, two digits', () => {
  mockGetHours.mockImplementation(() => 11);
  mockGetMinutes.mockImplementation(() => 22);
  mockGetSeconds.mockImplementation(() => 33);
  const print = createPrint({ timestamp: true });
  print.info('Test info');
  expect(mockConsoleLog.mock.calls).toEqual([['[2m11:22:33[22m - [34mTest info[39m']]);
});

test('print log with timestamp, two digits', () => {
  mockGetHours.mockImplementation(() => 11);
  mockGetMinutes.mockImplementation(() => 22);
  mockGetSeconds.mockImplementation(() => 33);
  const print = createPrint({ timestamp: true });
  print.log('Test log');
  expect(mockConsoleLog.mock.calls).toEqual([['[2m11:22:33[22m - [32mTest log[39m']]);
});

test('print warn with timestamp, two digits', () => {
  mockGetHours.mockImplementation(() => 11);
  mockGetMinutes.mockImplementation(() => 22);
  mockGetSeconds.mockImplementation(() => 33);
  const print = createPrint({ timestamp: true });
  print.warn('Test warn');
  expect(mockConsoleLog.mock.calls).toEqual([['[2m11:22:33[22m - [33mTest warn[39m']]);
});

test('print error with timestamp, two digits', () => {
  mockGetHours.mockImplementation(() => 11);
  mockGetMinutes.mockImplementation(() => 22);
  mockGetSeconds.mockImplementation(() => 33);
  const print = createPrint({ timestamp: true });
  print.error('Test error');
  expect(mockConsoleLog.mock.calls).toEqual([['[2m11:22:33[22m - [31mTest error[39m']]);
});
