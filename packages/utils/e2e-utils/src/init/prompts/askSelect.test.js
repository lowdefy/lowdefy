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

import askSelect from './askSelect.js';

const choices = [
  { title: 'Stable', value: 'stable' },
  { title: 'Experimental', value: 'experimental' },
];

function createOutput() {
  const written = [];
  return { written, write: (text) => written.push(text) };
}

function createAskWith(answers) {
  return vi.fn(async () => answers.shift());
}

test('askSelect selects the first choice for an empty answer', async () => {
  const output = createOutput();
  const result = await askSelect({ ask: createAskWith(['']), output, message: 'Which?', choices });
  expect(result).toEqual('stable');
  expect(output.written.join('')).toEqual('Which?\n  1. Stable\n  2. Experimental\n');
});

test('askSelect returns the value of the numbered choice', async () => {
  const result = await askSelect({
    ask: createAskWith(['2']),
    output: createOutput(),
    message: 'Which?',
    choices,
  });
  expect(result).toEqual('experimental');
});

test('askSelect asks again when the answer names more than one choice', async () => {
  const ask = createAskWith(['1,2', '1']);
  const output = createOutput();
  const result = await askSelect({ ask, output, message: 'Which?', choices });
  expect(result).toEqual('stable');
  expect(ask).toHaveBeenCalledTimes(2);
  expect(output.written).toContain('Enter one number from 1 to 2.\n');
});

test('askSelect returns null when the input closes', async () => {
  const result = await askSelect({
    ask: createAskWith([null]),
    output: createOutput(),
    message: 'Which?',
    choices,
  });
  expect(result).toBeNull();
});
