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

import { expect, test } from 'vitest';

import redactTelemetryError from './redactTelemetryError.js';

test('redactTelemetryError replaces the home directory in the message and stack', () => {
  const error = new Error('Could not read /Users/ada/apps/crm/lowdefy.yaml.');
  error.stack = [
    'Error: Could not read /Users/ada/apps/crm/lowdefy.yaml.',
    '    at readConfig (/Users/ada/apps/crm/node_modules/@lowdefy/build/dist/read.js:10:5)',
  ].join('\n');

  expect(redactTelemetryError(error, { homeDirectory: '/Users/ada' })).toEqual({
    name: 'Error',
    message: 'Could not read ~/apps/crm/lowdefy.yaml.',
    stack: '    at readConfig (~/apps/crm/node_modules/@lowdefy/build/dist/read.js:10:5)',
  });
});

test('redactTelemetryError cuts a long message, which can quote config values', () => {
  const error = new Error(`Received ${'x'.repeat(1000)}`);
  const { message } = redactTelemetryError(error, { homeDirectory: '/Users/ada' });
  expect(message.length).toBe(301);
  expect(message.endsWith('…')).toBe(true);
});

test('redactTelemetryError keeps no stack line that is not a frame', () => {
  const error = new Error('first line\nsecond line with data');
  error.stack = 'Error: first line\nsecond line with data\n    at run (/srv/cli.js:1:1)';
  expect(redactTelemetryError(error, { homeDirectory: '/Users/ada' }).stack).toBe(
    '    at run (/srv/cli.js:1:1)'
  );
});
