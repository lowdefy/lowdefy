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

import checkEnvironmentGuards from './checkEnvironmentGuards.js';

const guards = {
  secrets: { MONGODB_URI: 'acme-prod\\.mongodb\\.net' },
  env: { APP_HOST: '^app\\.example\\.com$' },
};
const names = ['LOWDEFY_SECRET_MONGODB_URI', 'APP_HOST'];
const saved = {};

beforeEach(() => {
  names.forEach((name) => {
    saved[name] = process.env[name];
    delete process.env[name];
  });
});

afterEach(() => {
  names.forEach((name) => {
    delete process.env[name];
    if (saved[name] !== undefined) process.env[name] = saved[name];
  });
});

test('checkEnvironmentGuards passes when every guarded value matches', () => {
  process.env.LOWDEFY_SECRET_MONGODB_URI = 'mongodb+srv://u:p@acme-prod.mongodb.net/db';
  process.env.APP_HOST = 'app.example.com';
  expect(() => checkEnvironmentGuards({ name: 'prod', guards })).not.toThrow();
});

test('checkEnvironmentGuards passes without guards or a current environment', () => {
  expect(() => checkEnvironmentGuards({ name: 'prod', guards: undefined })).not.toThrow();
  expect(() => checkEnvironmentGuards({ name: undefined, guards: undefined })).not.toThrow();
});

test('checkEnvironmentGuards names every failing variable without printing its value', () => {
  process.env.LOWDEFY_SECRET_MONGODB_URI = 'mongodb+srv://u:hunter2@acme-new.mongodb.net/db';
  expect(() => checkEnvironmentGuards({ name: 'prod', guards })).toThrow(
    'Environment "prod" guards failed: secret "MONGODB_URI" does not match its guard; environment variable "APP_HOST" is not set (APP_HOST).'
  );
  let message;
  try {
    checkEnvironmentGuards({ name: 'prod', guards });
  } catch (error) {
    message = error.message;
  }
  expect(message).not.toMatch('hunter2');
});
