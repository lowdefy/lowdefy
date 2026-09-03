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

import { jest } from '@jest/globals';

import missingSecrets from './missingSecrets.js';

const originalEnv = process.env;

function createContext() {
  const warnings = [];
  return {
    warnings,
    logger: { debug: jest.fn() },
    handleWarning: (warning) => warnings.push(warning),
  };
}

function connectionWithSecret(secretParams) {
  return {
    connections: [
      {
        id: 'connection:db',
        properties: { uri: { _secret: secretParams, '~k': 'key:uri' } },
      },
    ],
  };
}

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

test('missingSecrets is a check-only rule under the secrets slug', () => {
  expect(missingSecrets.slug).toBe('secrets');
  expect(missingSecrets.checkOnly).toBe(true);
});

test('missingSecrets is silent when the secret is set in the environment', () => {
  process.env.LOWDEFY_SECRET_MONGODB_URI = 'mongodb://localhost';
  const context = createContext();
  missingSecrets.run({ components: connectionWithSecret('MONGODB_URI'), context });
  expect(context.warnings).toEqual([]);
});

test('missingSecrets warns with the env var name and config location when the secret is missing', () => {
  delete process.env.LOWDEFY_SECRET_MONGODB_URI;
  const context = createContext();
  missingSecrets.run({ components: connectionWithSecret('MONGODB_URI'), context });
  expect(context.warnings).toHaveLength(1);
  expect(context.warnings[0].message).toContain('Secret "MONGODB_URI" is not set.');
  expect(context.warnings[0].message).toContain('LOWDEFY_SECRET_MONGODB_URI');
  expect(context.warnings[0].checkSlug).toBe('secrets');
  expect(context.warnings[0].configKey).toBe('key:uri');
});

test('missingSecrets checks the { key } form of _secret params', () => {
  delete process.env.LOWDEFY_SECRET_API_TOKEN;
  const context = createContext();
  missingSecrets.run({ components: connectionWithSecret({ key: 'API_TOKEN' }), context });
  expect(context.warnings).toHaveLength(1);
  expect(context.warnings[0].message).toContain('Secret "API_TOKEN" is not set.');
});

test('missingSecrets is silent when the { key } form declares a default', () => {
  delete process.env.LOWDEFY_SECRET_API_TOKEN;
  const context = createContext();
  missingSecrets.run({
    components: connectionWithSecret({ key: 'API_TOKEN', default: 'none' }),
    context,
  });
  expect(context.warnings).toEqual([]);
});

test('missingSecrets reports an operator-computed secret name as dynamic at debug, not as a warning', () => {
  const context = createContext();
  missingSecrets.run({
    components: connectionWithSecret({ key: { _state: 'secretName' } }),
    context,
  });
  expect(context.warnings).toEqual([]);
  expect(context.logger.debug).toHaveBeenCalledWith(
    '1 _secret reference names the secret with an operator: dynamic, unchecked.'
  );
});

test('missingSecrets reads a secret supplied through .env, which dotenv has merged into process.env', () => {
  process.env.LOWDEFY_SECRET_FROM_DOT_ENV = 'value-from-dot-env';
  const context = createContext();
  missingSecrets.run({ components: connectionWithSecret('FROM_DOT_ENV'), context });
  expect(context.warnings).toEqual([]);
});

test('missingSecrets warns that a reserved auth secret name never resolves, even when it is set', () => {
  process.env.LOWDEFY_SECRET_JWT_SECRET = 'set-but-filtered';
  const context = createContext();
  missingSecrets.run({ components: connectionWithSecret('JWT_SECRET'), context });
  expect(context.warnings).toHaveLength(1);
  expect(context.warnings[0].message).toContain('reserved for Lowdefy authentication');
});

test('missingSecrets reports one missing secret once per config location', () => {
  delete process.env.LOWDEFY_SECRET_TOKEN;
  const context = createContext();
  missingSecrets.run({
    components: {
      connections: [
        { properties: { a: { _secret: 'TOKEN', '~k': 'key:a' } } },
        { properties: { b: { _secret: { key: 'TOKEN' }, '~k': 'key:b' } } },
        { properties: { c: { _secret: 'TOKEN', '~k': 'key:a' } } },
      ],
    },
    context,
  });
  expect(context.warnings.map((warning) => warning.configKey)).toEqual(['key:a', 'key:b']);
});

test('missingSecrets warns for a _build.env name the walker recorded that the environment does not set', () => {
  const context = createContext();
  context.envReferences = [
    { name: 'LDF_TEST_ENV_MISSING', hasDefault: false, configKey: 'k_env_1' },
    { name: 'LDF_TEST_ENV_DEFAULTED', hasDefault: true, configKey: 'k_env_2' },
    { name: 'PATH', hasDefault: false, configKey: 'k_env_3' },
  ];
  missingSecrets.run({ components: {}, context });
  expect(context.warnings).toHaveLength(1);
  expect(context.warnings[0].message).toContain('Environment variable "LDF_TEST_ENV_MISSING" is not set');
  expect(context.warnings[0].configKey).toBe('k_env_1');
});

