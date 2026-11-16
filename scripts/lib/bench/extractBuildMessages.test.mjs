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

import assert from 'node:assert/strict';
import { test } from 'node:test';

import extractBuildMessages from './extractBuildMessages.mjs';

const gray = (text) => `\x1b[2m${text}\x1b[0m`;
const blue = (text) => `\x1b[34m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;

test('extractBuildMessages keeps warnings and errors with the location printed before them, sorted', () => {
  const output = [
    `${gray('11:53:38')} ∙ Running 'lowdefy build'.`,
    `${gray('11:54:04')} ∙ ${blue('/srv/server/pages/b.yaml:3')}`,
    `${gray('11:54:04')} ⚠ ${yellow('[ConfigWarning] Second.')}`,
    `${gray('11:54:05')} ⚠ ${yellow('A warning with no location.')}`,
    `${gray('11:54:06')} ∙ ${blue('/srv/server/pages/a.yaml:1')}`,
    `${gray('11:54:06')} ✖ First error.`,
    '- Installing dependencies.',
    `${gray('11:54:09')} ✔ Build successful.`,
  ].join('\n');
  assert.deepEqual(
    extractBuildMessages({
      output,
      replacePath: (value) => value.replaceAll('/srv/server', '<server>'),
    }),
    [
      '⚠ <server>/pages/b.yaml:3: [ConfigWarning] Second.',
      '⚠ A warning with no location.',
      '✖ <server>/pages/a.yaml:1: First error.',
    ]
  );
});

test('extractBuildMessages does not take a plain info line as a location', () => {
  const output = [
    `${gray('11:53:38')} ∙ Lowdefy build successful.`,
    `${gray('11:53:39')} ⚠ ${yellow('Running local @lowdefy/server.')}`,
  ].join('\n');
  assert.deepEqual(extractBuildMessages({ output }), ['⚠ Running local @lowdefy/server.']);
});
