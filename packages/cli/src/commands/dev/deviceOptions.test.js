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
import { Command } from 'commander';

import deviceOptions from './deviceOptions.js';

function parse(args) {
  const command = new Command('dev')
    .exitOverride()
    .addOption(deviceOptions.ios)
    .addOption(deviceOptions.android)
    .addOption(deviceOptions.lan);
  command.parse(args, { from: 'user' });
  return command.opts();
}

test('lowdefy dev takes no device flags by default', () => {
  expect(parse([])).toEqual({});
});

test('lowdefy dev parses --ios, --android and a bare --lan', () => {
  expect(parse(['--ios', '--android', '--lan'])).toEqual({ ios: true, android: true, lan: true });
});

test('lowdefy dev parses --lan with an interface name', () => {
  expect(parse(['--lan', 'en0'])).toEqual({ lan: 'en0' });
});

test('lowdefy dev refuses a value for --ios', () => {
  expect(() => parse(['--ios=yes'])).toThrow();
});
