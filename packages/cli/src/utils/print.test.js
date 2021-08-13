/*
  Copyright 2020-2021 Lowdefy, Inc

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

// eslint-disable-next-line no-unused-vars
import ora from 'ora';
import { createOraPrint, createBasicPrint } from './print';

jest.mock('ora', () => {
  const mockOraConstructor = jest.fn();
  return mockOraConstructor;
});

const mockOraFail = jest.fn();
const mockOraInfo = jest.fn();
const mockOraStart = jest.fn();
const mockOraStopAndPersist = jest.fn();
const mockOraSucceed = jest.fn();
const mockOraWarn = jest.fn();

ora.mockImplementation(() => ({
  fail: mockOraFail,
  info: mockOraInfo,
  start: mockOraStart,
  stopAndPersist: mockOraStopAndPersist,
  succeed: mockOraSucceed,
  warn: mockOraWarn,
}));

mockOraStart.mockImplementation(() => ({ stopAndPersist: mockOraStopAndPersist }));

// mock console
const mockConsoleError = jest.fn();
const mockConsoleInfo = jest.fn();
const mockConsoleLog = jest.fn();
const mockConsoleWarn = jest.fn();
console.error = mockConsoleError;
console.info = mockConsoleInfo;
console.log = mockConsoleLog;
console.warn = mockConsoleWarn;

// Mock timestamps
const mockGetHours = jest.fn();
const mockGetMinutes = jest.fn();
const mockGetSeconds = jest.fn();
// const realNow = Date.now;
// eslint-disable-next-line no-global-assign
Date = jest.fn(() => ({
  getHours: mockGetHours,
  getMinutes: mockGetMinutes,
  getSeconds: mockGetSeconds,
}));

Date.now = () => {};

beforeEach(() => {
  mockGetHours.mockReset();
  mockGetMinutes.mockReset();
  mockGetSeconds.mockReset();
});

// afterAll(() => {
//   console.log = realLog;
//   Date.now = realNow;
// });

describe('memoise', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  test('memoise print', () => {
    const createPrint = require('./print').default;
    const print1 = createPrint();
    const print2 = createPrint();
    expect(print1).toBe(print2);
  });

  test('createOraPrint', () => {
    let createPrint;
    jest.isolateModules(() => {
      createPrint = require('./print').default;
    });
    const print = createPrint();
    expect(print.type).toEqual('ora');
  });

  test('createBasicPrint', () => {
    let createPrint;
    jest.isolateModules(() => {
      createPrint = require('./print').default;
    });
    const realCI = process.env.CI;
    process.env.CI = 'true';
    const print = createPrint();
    expect(print.type).toEqual('basic');
    process.env.CI = realCI;
  });
});
describe('ora print', () => {
  test('create print', () => {
    const print = createOraPrint();
    expect(print).toMatchInlineSnapshot(`
      Object {
        "error": [Function],
        "info": [Function],
        "log": [Function],
        "spin": [Function],
        "succeed": [Function],
        "type": "ora",
        "warn": [Function],
      }
    `);
    expect(ora.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "color": "blue",
            "prefixText": [Function],
            "spinner": "random",
          },
        ],
      ]
    `);
  });

  test('timestamp, digits less than 10', () => {
    mockGetHours.mockImplementation(() => 1);
    mockGetMinutes.mockImplementation(() => 2);
    mockGetSeconds.mockImplementation(() => 3);
    createOraPrint();
    const prefixTextFn = ora.mock.calls[0][0].prefixText;
    const res = prefixTextFn();
    expect(res).toEqual('[2m01:02:03[22m');
  });

  test('timestamp, digits more than 10', () => {
    mockGetHours.mockImplementation(() => 11);
    mockGetMinutes.mockImplementation(() => 22);
    mockGetSeconds.mockImplementation(() => 33);
    createOraPrint();
    const prefixTextFn = ora.mock.calls[0][0].prefixText;
    const res = prefixTextFn();
    expect(res).toEqual('[2m11:22:33[22m');
  });

  test('print error', () => {
    const print = createOraPrint();
    print.error('Test error');
    expect(mockOraFail.mock.calls).toEqual([['[31mTest error[39m']]);
  });

  test('print info', () => {
    const print = createOraPrint();
    print.info('Test info');
    expect(mockOraInfo.mock.calls).toEqual([['[34mTest info[39m']]);
  });

  test('print log', () => {
    const print = createOraPrint();
    print.log('Test log');
    expect(mockOraStart.mock.calls).toEqual([['Test log']]);
    expect(mockOraStopAndPersist.mock.calls).toEqual([[{ symbol: '∙' }]]);
  });

  test('print spin', () => {
    const print = createOraPrint();
    print.spin('Test spin');
    expect(mockOraStart.mock.calls).toEqual([['Test spin']]);
  });

  test('print succeed', () => {
    const print = createOraPrint();
    print.succeed('Test succeed');
    expect(mockOraSucceed.mock.calls).toEqual([['[32mTest succeed[39m']]);
  });

  test('print warn', () => {
    const print = createOraPrint();
    print.warn('Test warn');
    expect(mockOraWarn.mock.calls).toEqual([['[33mTest warn[39m']]);
  });
});

describe('basic print', () => {
  test('create print', () => {
    const print = createBasicPrint();
    expect(print).toMatchInlineSnapshot(`
      Object {
        "error": [MockFunction],
        "info": [MockFunction],
        "log": [MockFunction],
        "spin": [MockFunction],
        "succeed": [MockFunction],
        "type": "basic",
        "warn": [MockFunction],
      }
    `);
  });

  test('print error', () => {
    const print = createBasicPrint();
    print.error('Test error');
    expect(mockConsoleError.mock.calls).toEqual([['Test error']]);
  });

  test('print info', () => {
    const print = createBasicPrint();
    print.info('Test info');
    expect(mockConsoleInfo.mock.calls).toEqual([['Test info']]);
  });

  test('print log', () => {
    const print = createBasicPrint();
    print.log('Test log');
    expect(mockConsoleLog.mock.calls).toEqual([['Test log']]);
  });

  test('print spin', () => {
    const print = createBasicPrint();
    print.spin('Test spin');
    expect(mockConsoleLog.mock.calls).toEqual([['Test spin']]);
  });

  test('print succeed', () => {
    const print = createBasicPrint();
    print.succeed('Test succeed');
    expect(mockConsoleLog.mock.calls).toEqual([['Test succeed']]);
  });

  test('print warn', () => {
    const print = createBasicPrint();
    print.warn('Test warn');
    expect(mockConsoleWarn.mock.calls).toEqual([['Test warn']]);
  });
});
