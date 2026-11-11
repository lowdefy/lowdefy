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

import removeSecretsFromEnv from './removeSecretsFromEnv.js';

test('removeSecretsFromEnv removes every LOWDEFY_SECRET_ value and CRON_SECRET, and nothing else', () => {
  const env = {
    CRON_SECRET: 'cron',
    LOWDEFY_SECRET_MONGODB_URI: 'mongodb+srv://real',
    LOWDEFY_SECRET_API_KEY: 'key',
    LOWDEFY_LOG_LEVEL: 'info',
    PATH: '/usr/bin',
  };
  expect(removeSecretsFromEnv({ env }).sort()).toEqual([
    'CRON_SECRET',
    'LOWDEFY_SECRET_API_KEY',
    'LOWDEFY_SECRET_MONGODB_URI',
  ]);
  expect(env).toEqual({ LOWDEFY_LOG_LEVEL: 'info', PATH: '/usr/bin' });
});

test('removeSecretsFromEnv removes nothing from an environment without secrets', () => {
  const env = { PATH: '/usr/bin' };
  expect(removeSecretsFromEnv({ env })).toEqual([]);
  expect(env).toEqual({ PATH: '/usr/bin' });
});
