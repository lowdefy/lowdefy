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

import { ConfigError } from '@lowdefy/errors';

import validateConfig from './validateConfig.js';
import testContext from '../test-utils/testContext.js';

const vercelEnv = process.env.VERCEL;

afterEach(() => {
  if (vercelEnv === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = vercelEnv;
  }
});

function warningsFor({ config, env }) {
  if (env === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = env;
  }
  const context = testContext();
  context.warnings = [];
  validateConfig({ components: { config: { '~k': 'config_key', ...config } }, context });
  return context.warnings;
}

test.each([
  ['exceeds config.vercel.maxDuration', { requestTimeout: 90000, vercel: { maxDuration: 60 } }],
  ['equals config.vercel.maxDuration', { requestTimeout: 60000, vercel: { maxDuration: 60 } }],
  ['is the 30 s default over a shorter maxDuration', { vercel: { maxDuration: 20 } }],
])('validateConfig warns when config.requestTimeout %s', (_, config) => {
  const warnings = warningsFor({ config });
  expect(warnings).toHaveLength(1);
  expect(warnings[0].name).toBe('ConfigWarning');
  expect(warnings[0].configKey).toBe('config_key');
});

test('validateConfig warns against the 60 s Vercel default when the build runs on Vercel', () => {
  const warnings = warningsFor({ config: { requestTimeout: 90000 }, env: '1' });
  expect(warnings.map((warning) => warning.message)).toEqual([
    `App "config.requestTimeout" (90000 ms) is not shorter than the Vercel function's maxDuration (60 s). Vercel stops the function first, so the request timeout never answers and the calls a request left running are not cancelled. Set "config.requestTimeout" below 60000 ms, or raise "config.vercel.maxDuration".`,
  ]);
});

test.each([
  ['is shorter than maxDuration', { requestTimeout: 50000, vercel: { maxDuration: 60 } }, '1'],
  ['is the default under the Vercel default', {}, '1'],
  ['is disabled', { requestTimeout: 0, vercel: { maxDuration: 10 } }, undefined],
  ['is long but the app does not target Vercel', { requestTimeout: 900000 }, undefined],
])('validateConfig does not warn when config.requestTimeout %s', (_, config, env) => {
  expect(warningsFor({ config, env })).toEqual([]);
});
