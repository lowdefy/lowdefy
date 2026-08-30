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

import confirmMigrate from './confirmMigrate.js';

function testContext() {
  return { logger: { info: () => {} } };
}

function ttyInput(line) {
  const stream = new PassThrough();
  stream.isTTY = true;
  if (line !== undefined) {
    process.nextTick(() => stream.write(`${line}\n`));
  }
  return stream;
}

test('confirmMigrate returns true without prompting for --dry-run', async () => {
  const result = await confirmMigrate({ context: testContext(), options: { dryRun: true } });
  expect(result).toBe(true);
});

test('confirmMigrate returns true without prompting for --yes', async () => {
  const result = await confirmMigrate({ context: testContext(), options: { yes: true } });
  expect(result).toBe(true);
});

test('confirmMigrate returns true without prompting for --json', async () => {
  const result = await confirmMigrate({ context: testContext(), options: { json: true } });
  expect(result).toBe(true);
});

test('confirmMigrate throws when stdin is not a TTY and neither --yes nor --dry-run is set', async () => {
  const input = new PassThrough();
  input.isTTY = false;
  await expect(
    confirmMigrate({ context: testContext(), options: {}, input, output: new PassThrough() })
  ).rejects.toThrow('needs confirmation');
});

test('confirmMigrate returns true when the user answers yes', async () => {
  const result = await confirmMigrate({
    context: testContext(),
    options: {},
    input: ttyInput('y'),
    output: new PassThrough(),
  });
  expect(result).toBe(true);
});

test('confirmMigrate returns false when the user answers no', async () => {
  const result = await confirmMigrate({
    context: testContext(),
    options: {},
    input: ttyInput('n'),
    output: new PassThrough(),
  });
  expect(result).toBe(false);
});
