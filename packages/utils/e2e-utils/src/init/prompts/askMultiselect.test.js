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

import askMultiselect from './askMultiselect.js';

const choices = [
  { title: 'app-a (apps/a)', value: 'a' },
  { title: 'app-b (apps/b)', value: 'b' },
  { title: 'app-c (apps/c)', value: 'c' },
];

function createOutput() {
  const written = [];
  return { written, write: (text) => written.push(text) };
}

function createAskWith(answers) {
  return vi.fn(async () => answers.shift());
}

test('askMultiselect lists the choices numbered', async () => {
  const output = createOutput();
  await askMultiselect({ ask: createAskWith(['']), output, message: 'Which apps?', choices });
  expect(output.written.join('')).toEqual(
    'Which apps?\n  1. app-a (apps/a)\n  2. app-b (apps/b)\n  3. app-c (apps/c)\n'
  );
});

test('askMultiselect selects every choice for an empty answer', async () => {
  const result = await askMultiselect({
    ask: createAskWith(['']),
    output: createOutput(),
    message: 'Which apps?',
    choices,
  });
  expect(result).toEqual(['a', 'b', 'c']);
});

test('askMultiselect returns the values of the numbered choices', async () => {
  const result = await askMultiselect({
    ask: createAskWith(['1,3']),
    output: createOutput(),
    message: 'Which apps?',
    choices,
  });
  expect(result).toEqual(['a', 'c']);
});

test('askMultiselect asks again after an invalid answer', async () => {
  const ask = createAskWith(['4', '2']);
  const output = createOutput();
  const result = await askMultiselect({ ask, output, message: 'Which apps?', choices });
  expect(result).toEqual(['b']);
  expect(ask).toHaveBeenCalledTimes(2);
  expect(output.written).toContain('Enter numbers from 1 to 3, for example 1,3.\n');
});

test('askMultiselect returns null when the input closes', async () => {
  const result = await askMultiselect({
    ask: createAskWith([null]),
    output: createOutput(),
    message: 'Which apps?',
    choices,
  });
  expect(result).toBeNull();
});
