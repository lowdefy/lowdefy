/*
  Copyright 2020-2024 Lowdefy, Inc

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

import getSecretsFromEnv from './getSecretsFromEnv.js';

const realEnv = process.env;

afterEach(() => {
  process.env = realEnv;
});

test('Get secret from env', () => {
  process.env = {
    LOWDEFY_SECRET_TEST: 'supersecret',
  };
  const secrets = getSecretsFromEnv();
  expect(secrets).toEqual({
    TEST: 'supersecret',
  });
});

test('Get multiple secrets from env, ignore other env variable', () => {
  process.env = {
    LOWDEFY_SECRET_TEST_1: 'supersecret1',
    LOWDEFY_SECRET_TEST_2: 'supersecret2',
    OTHER_VAR: 'other',
    ANOTHER_VAR: 'another',
    ASDF_GHJK: 'asdfghjk',
  };
  const secrets = getSecretsFromEnv();
  expect(secrets).toEqual({
    TEST_1: 'supersecret1',
    TEST_2: 'supersecret2',
  });
});

test('Only replace first occurrence of "LOWDEFY_SECRET_"', () => {
  process.env = {
    LOWDEFY_SECRET_LOWDEFY_SECRET_TEST: 'supersecret',
  };
  const secrets = getSecretsFromEnv();
  expect(secrets).toEqual({
    LOWDEFY_SECRET_TEST: 'supersecret',
  });
});

test('Return an empty object if no secrets', () => {
  process.env = {
    OTHER_VAR: 'other',
    ANOTHER_VAR: 'another',
    ASDF_GHJK: 'asdfghjk',
  };
  const secrets = getSecretsFromEnv();
  expect(secrets).toEqual({});
});

test('Secrets are immutable', () => {
  process.env = {
    LOWDEFY_SECRET_TEST: 'supersecret',
  };
  const secrets = getSecretsFromEnv();
  expect(secrets).toEqual({
    TEST: 'supersecret',
  });
  expect(() => {
    secrets.test = 'changed';
  }).toThrow(TypeError);
});
