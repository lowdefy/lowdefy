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

import { PassThrough } from 'node:stream';
import { expect, test, vi } from 'vitest';

import createAsk from './createAsk.js';

test('createAsk answers each question with the next line, even when lines arrive at once', async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  const { ask, close } = createAsk({ input, output, onInterrupt: vi.fn() });
  input.write(' 1,2 \ny\n\n');
  expect(await ask('First? ')).toEqual('1,2');
  expect(await ask('Second? ')).toEqual('y');
  expect(await ask('Third? ')).toEqual('');
  close();
});

test('createAsk writes the question to the output', async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  const written = [];
  output.on('data', (chunk) => written.push(chunk.toString()));
  const { ask, close } = createAsk({ input, output, onInterrupt: vi.fn() });
  input.write('answer\n');
  await ask('Question? ');
  close();
  expect(written.join('')).toContain('Question? ');
});

test('createAsk resolves to null once the input has ended', async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  const { ask, close } = createAsk({ input, output, onInterrupt: vi.fn() });
  input.end();
  expect(await ask('Question? ')).toBeNull();
  close();
});
