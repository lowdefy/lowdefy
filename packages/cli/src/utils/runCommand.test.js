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
import { wait } from '@lowdefy/helpers';

jest.unstable_mockModule('./errorHandler', () => ({
  default: jest.fn(),
}));
jest.unstable_mockModule('./startUp', () => ({
  default: jest.fn(),
}));

const options = { option: true };
const command = { command: true, name: () => 'test' };
const cliVersion = 'cliVersion';

test('runCommand with synchronous function', async () => {
  const { default: runCommand } = await import('./runCommand.js');

  const handler = jest.fn(() => 1 + 1);
  const wrapped = runCommand({ cliVersion, handler });
  const res = await wrapped(options, command);
  expect(res).toBe(2);
  expect(handler).toHaveBeenCalled();
});

test('runCommand with asynchronous function', async () => {
  const { default: runCommand } = await import('./runCommand.js');
  const handler = jest.fn(async () => {
    await wait(3);
    return 4;
  });
  const wrapped = runCommand({ cliVersion, handler });
  const res = await wrapped(options, command);
  expect(res).toBe(4);
  expect(handler).toHaveBeenCalled();
});

test('runCommand calls startUp', async () => {
  const { default: runCommand } = await import('./runCommand.js');
  const { default: startUp } = await import('./startUp.js');
  const handler = jest.fn((...args) => args);
  const wrapped = runCommand({ cliVersion, handler });
  const res = await wrapped(options, command);
  expect(res).toMatchInlineSnapshot(`
    Array [
      Object {
        "context": Object {
          "cliVersion": "cliVersion",
        },
      },
    ]
  `);
  expect(startUp.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "command": Object {
            "command": true,
            "name": [Function],
          },
          "context": Object {
            "cliVersion": "cliVersion",
          },
          "options": Object {
            "option": true,
          },
        },
      ],
    ]
  `);
});

test('Catch error synchronous function', async () => {
  const { default: runCommand } = await import('./runCommand.js');
  const { default: errorHandler } = await import('./errorHandler.js');
  const handler = jest.fn(() => {
    throw new Error('Error');
  });
  const wrapped = runCommand({ cliVersion, handler });
  await wrapped(options, command);
  expect(handler).toHaveBeenCalled();
  expect(errorHandler.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "context": Object {
            "cliVersion": "cliVersion",
          },
          "error": [Error: Error],
        },
      ],
    ]
  `);
});

test('Catch error asynchronous function', async () => {
  const { default: runCommand } = await import('./runCommand.js');
  const { default: errorHandler } = await import('./errorHandler.js');
  const handler = jest.fn(async () => {
    await wait(3);
    throw new Error('Async Error');
  });
  const wrapped = runCommand({ cliVersion, handler });
  await wrapped(options, command);
  expect(handler).toHaveBeenCalled();
  expect(errorHandler.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "context": Object {
            "cliVersion": "cliVersion",
          },
          "error": [Error: Async Error],
        },
      ],
    ]
  `);
});
