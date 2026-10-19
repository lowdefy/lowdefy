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

import getCanonicalUrl from './getCanonicalUrl.js';

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

const config = {
  environment: 'staging',
  environments: { staging: { url: 'https://staging.example.com' } },
};

beforeEach(() => {
  delete process.env.BETTER_AUTH_URL;
});

afterAll(() => {
  delete process.env.BETTER_AUTH_URL;
  if (originalBetterAuthUrl !== undefined) process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
});

test('getCanonicalUrl prefers BETTER_AUTH_URL', () => {
  process.env.BETTER_AUTH_URL = ' https://auth.example.com ';
  expect(getCanonicalUrl({ config })).toBe('https://auth.example.com');
});

test('getCanonicalUrl falls back to the current environment url', () => {
  expect(getCanonicalUrl({ config })).toBe('https://staging.example.com');
});

test('getCanonicalUrl falls back to the environment url when BETTER_AUTH_URL is blank', () => {
  process.env.BETTER_AUTH_URL = '  ';
  expect(getCanonicalUrl({ config })).toBe('https://staging.example.com');
});

test('getCanonicalUrl returns null without BETTER_AUTH_URL or an environment url', () => {
  expect(getCanonicalUrl({ config: {} })).toBe(null);
});
