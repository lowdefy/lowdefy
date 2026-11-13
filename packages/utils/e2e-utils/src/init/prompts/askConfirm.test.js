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

import { expect, test, vi } from 'vitest';

import askConfirm from './askConfirm.js';

function createOutput() {
  const written = [];
  return { written, write: (text) => written.push(text) };
}

function createAskWith(answers) {
  return vi.fn(async () => answers.shift());
}

test('askConfirm shows the default in the hint and returns it for an empty answer', async () => {
  const ask = createAskWith(['']);
  const result = await askConfirm({ ask, output: createOutput(), message: 'Add?', initial: false });
  expect(result).toBe(false);
  expect(ask).toHaveBeenCalledWith('Add? (y/N) ');
});

test('askConfirm shows a yes default as Y/n', async () => {
  const ask = createAskWith(['']);
  const result = await askConfirm({ ask, output: createOutput(), message: 'Add?', initial: true });
  expect(result).toBe(true);
  expect(ask).toHaveBeenCalledWith('Add? (Y/n) ');
});

test('askConfirm accepts y, yes, n and no in any case', async () => {
  const output = createOutput();
  for (const [answer, expected] of [
    ['y', true],
    ['YES', true],
    ['n', false],
    ['No', false],
  ]) {
    const ask = createAskWith([answer]);
    expect(await askConfirm({ ask, output, message: 'Add?', initial: false })).toBe(expected);
  }
});

test('askConfirm asks again after an invalid answer', async () => {
  const ask = createAskWith(['maybe', 'y']);
  const output = createOutput();
  const result = await askConfirm({ ask, output, message: 'Add?', initial: false });
  expect(result).toBe(true);
  expect(ask).toHaveBeenCalledTimes(2);
  expect(output.written).toContain('Enter y or n.\n');
});

test('askConfirm returns null when the input closes', async () => {
  const result = await askConfirm({
    ask: createAskWith([null]),
    output: createOutput(),
    message: 'Add?',
    initial: false,
  });
  expect(result).toBeNull();
});
