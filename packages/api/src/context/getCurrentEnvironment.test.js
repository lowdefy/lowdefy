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

import getCurrentEnvironment from './getCurrentEnvironment.js';

const environments = {
  prod: { url: 'https://app.example.com' },
  staging: { url: 'https://staging.example.com', email: { filter: { replaceAddress: 'a@b.co' } } },
};

test('getCurrentEnvironment returns the current environment settings with its name', () => {
  expect(getCurrentEnvironment({ config: { environment: 'staging', environments } })).toEqual({
    name: 'staging',
    url: 'https://staging.example.com',
    email: { filter: { replaceAddress: 'a@b.co' } },
  });
});

test('getCurrentEnvironment returns null without a current environment', () => {
  expect(getCurrentEnvironment({ config: { environments } })).toBe(null);
});

test('getCurrentEnvironment returns null when the environment is named but not declared', () => {
  expect(getCurrentEnvironment({ config: { environment: 'prod' } })).toBe(null);
});

test('getCurrentEnvironment returns null without config', () => {
  expect(getCurrentEnvironment({ config: undefined })).toBe(null);
});
