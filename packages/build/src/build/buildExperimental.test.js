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

import buildExperimental from './buildExperimental.js';

function run(config) {
  const context = {};
  buildExperimental({ components: { config }, context });
  return context;
}

test('buildExperimental turns no feature on when config.experimental is not set', () => {
  expect(run({}).experimental).toEqual({});
});

test('buildExperimental records the features the app opts in to', () => {
  expect(run({ experimental: { mobile: true } }).experimental).toEqual({ mobile: true });
  expect(run({ experimental: { mobile: false } }).experimental).toEqual({ mobile: false });
});

test('buildExperimental ignores build keys on config.experimental', () => {
  expect(run({ experimental: { mobile: true, '~k': 'a1' } }).experimental).toEqual({
    mobile: true,
  });
});

test('buildExperimental refuses config.experimental that is not an object', () => {
  expect(() => run({ experimental: true })).toThrow(
    'App "config.experimental" should be an object.'
  );
});

test('buildExperimental refuses a feature that is not experimental', () => {
  expect(() => run({ experimental: { offline: true } })).toThrow(
    'App "config.experimental.offline" is not an experimental feature. The experimental features are "mobile".'
  );
});

test('buildExperimental refuses a value that is not a boolean', () => {
  expect(() => run({ experimental: { mobile: 'yes' } })).toThrow(
    'App "config.experimental.mobile" should be a boolean.'
  );
});
