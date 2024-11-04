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

import buildApi from './buildApi.js';
import testContext from '../../test/testContext.js';

const mockLogWarn = jest.fn();
const mockLog = jest.fn();

const logger = {
  warn: mockLogWarn,
  log: mockLog,
};

const context = testContext({ logger });

beforeEach(() => {
  mockLogWarn.mockReset();
  mockLog.mockReset();
});

test('invalid control', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: { ':invalid': 'step' },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Invalid control type(s) for endpoint api1. Received "[":invalid"]"'
  );
});

test('missing required controls', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: { ':if': true },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Missing required control type(s) for endpoint api1. Missing [":then"]'
  );
});

test('throw more than one control', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: { ':if': true, ':then': [], ':try': [], ':catch': 'error' },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'More than one control type found for endpoint api1. Received [":if",":try"]'
  );
});

test('throw invalid control with a valid control', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: { ':if': true, ':then': [], ':invalid': [], ':catch': 'error' },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Invalid control type(s) for endpoint api1. Received [":invalid",":catch"]'
  );
});

test('throw switch not an array', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: { ':switch': true },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Type given for :switch control is invalid at endpoint api1. Received true'
  );
});

test('throw missing :case for :switch control', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        routine: { ':switch': [{ ':then': {} }] },
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Missing required control type(s) for endpoint api1. Missing [":case"]'
  );
});
