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

import readTestSecrets from './readTestSecrets.js';

test('readTestSecrets reads every LOWDEFY_SECRET_ variable by its secret name, and nothing else', () => {
  expect(
    readTestSecrets({
      dotEnvNames: [],
      env: {
        CRON_SECRET: 'cron',
        LOWDEFY_SECRET_EMPTY: '',
        LOWDEFY_SECRET_ORG_ID: 'org-a',
        PATH: '/usr/bin',
      },
    })
  ).toEqual({ EMPTY: '', ORG_ID: 'org-a' });
});

test('readTestSecrets leaves out a secret the CLI loaded from the .env file', () => {
  expect(
    readTestSecrets({
      dotEnvNames: ['LOWDEFY_SECRET_MONGODB_URI', 'OTHER'],
      env: {
        LOWDEFY_SECRET_MONGODB_URI: 'mongodb://real',
        LOWDEFY_SECRET_ORG_ID: 'org-a',
        OTHER: 'x',
      },
    })
  ).toEqual({ ORG_ID: 'org-a' });
});

test('readTestSecrets returns no secrets from an environment without any', () => {
  expect(readTestSecrets({ dotEnvNames: [], env: { PATH: '/usr/bin' } })).toEqual({});
});
