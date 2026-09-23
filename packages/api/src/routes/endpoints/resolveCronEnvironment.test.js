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

import resolveCronEnvironment from './resolveCronEnvironment.js';

const config = {
  cron: {
    environments: {
      '~k': 'k1',
      staging: { url: 'https://staging.example.com', secret: 'S' },
      production: {},
    },
  },
};

test('returns undefined when config.cron is not defined and no environment is named', () => {
  expect(resolveCronEnvironment({ config: {}, environment: undefined })).toBe(undefined);
});

test('throws when an environment is named but config.cron is not defined', () => {
  expect(() => resolveCronEnvironment({ config: {}, environment: 'staging' })).toThrow(
    'Cron environment "staging" is not configured: lowdefy.config.cron.environments is not defined.'
  );
});

test('returns the named environment when it is declared', () => {
  expect(resolveCronEnvironment({ config, environment: 'staging' })).toBe('staging');
});

test('throws for an undeclared environment name, including build key markers', () => {
  expect(() => resolveCronEnvironment({ config, environment: 'develop' })).toThrow(
    'Cron environment "develop" is not declared in lowdefy.config.cron.environments.'
  );
  expect(() => resolveCronEnvironment({ config, environment: '~k' })).toThrow(
    'Cron environment "~k" is not declared'
  );
});

test('resolves the host environment (no url) when no environment is named', () => {
  expect(resolveCronEnvironment({ config, environment: undefined })).toBe('production');
});
