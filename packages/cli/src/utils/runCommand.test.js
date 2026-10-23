/*
  Copyright 2020-2026 Lowdefy, Inc

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

import { vi, afterEach, expect, test } from 'vitest';
import { wait } from '@lowdefy/helpers';

vi.doMock('./errorHandler', () => ({
  default: vi.fn(),
}));
vi.doMock('./startUp', () => ({
  default: vi.fn(),
}));

const options = { option: true };
const command = { command: true, name: () => 'test' };
const cliVersion = 'cliVersion';

const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {});

afterEach(() => {
  mockExit.mockClear();
});

test('runCommand with synchronous function', async () => {
  const { default: runCommand } = await import('./runCommand.js');

  const handler = vi.fn(() => 1 + 1);
  const wrapped = runCommand({ cliVersion, handler });
  const res = await wrapped(options, command);
  expect(res).toBe(2);
  expect(handler).toHaveBeenCalled();
});

test('runCommand with asynchronous function', async () => {
  const { default: runCommand } = await import('./runCommand.js');
  const handler = vi.fn(async () => {
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
  const handler = vi.fn((...args) => args);
  const wrapped = runCommand({ cliVersion, handler });
  const res = await wrapped(options, command);
  expect(res).toMatchInlineSnapshot(`
    [
      {
        "context": {
          "cliVersion": "cliVersion",
        },
        "params": [],
      },
    ]
  `);
  expect(startUp.mock.calls).toMatchInlineSnapshot(`
    [
      [
        {
          "command": {
            "command": true,
            "name": [Function],
          },
          "context": {
            "cliVersion": "cliVersion",
          },
          "options": {
            "option": true,
          },
        },
      ],
    ]
  `);
});

test('runCommand passes positional arguments to the handler as params', async () => {
  const { default: runCommand } = await import('./runCommand.js');
  const handler = vi.fn(({ params }) => params);
  const wrapped = runCommand({ cliVersion, handler });
  const res = await wrapped(['a.jsonl', 'b.jsonl'], options, command);
  expect(res).toEqual([['a.jsonl', 'b.jsonl']]);
});

test('Catch error synchronous function', async () => {
  const { default: runCommand } = await import('./runCommand.js');
  const { default: errorHandler } = await import('./errorHandler.js');
  const handler = vi.fn(() => {
    throw new Error('Error');
  });
  const wrapped = runCommand({ cliVersion, handler });
  await wrapped(options, command);
  expect(handler).toHaveBeenCalled();
  expect(errorHandler.mock.calls).toMatchInlineSnapshot(`
    [
      [
        {
          "context": {
            "cliVersion": "cliVersion",
          },
          "error": [Error: Error],
        },
      ],
    ]
  `);
  expect(mockExit).toHaveBeenCalledWith(1);
});

test('Catch error asynchronous function', async () => {
  const { default: runCommand } = await import('./runCommand.js');
  const { default: errorHandler } = await import('./errorHandler.js');
  const handler = vi.fn(async () => {
    await wait(3);
    throw new Error('Async Error');
  });
  const wrapped = runCommand({ cliVersion, handler });
  await wrapped(options, command);
  expect(handler).toHaveBeenCalled();
  expect(errorHandler.mock.calls).toMatchInlineSnapshot(`
    [
      [
        {
          "context": {
            "cliVersion": "cliVersion",
          },
          "error": [Error: Async Error],
        },
      ],
    ]
  `);
  expect(mockExit).toHaveBeenCalledWith(1);
});
