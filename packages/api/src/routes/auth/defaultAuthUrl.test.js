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

import defaultAuthUrl from './defaultAuthUrl.js';

const originalAuthUrl = process.env.AUTH_URL;
const originalNextAuthUrl = process.env.NEXTAUTH_URL;

const config = {
  environment: 'staging',
  environments: { staging: { url: 'https://staging.example.com' } },
};

beforeEach(() => {
  delete process.env.AUTH_URL;
  delete process.env.NEXTAUTH_URL;
});

afterAll(() => {
  delete process.env.AUTH_URL;
  delete process.env.NEXTAUTH_URL;
  if (originalAuthUrl !== undefined) process.env.AUTH_URL = originalAuthUrl;
  if (originalNextAuthUrl !== undefined) process.env.NEXTAUTH_URL = originalNextAuthUrl;
});

test('defaultAuthUrl sets AUTH_URL to the current environment url', () => {
  defaultAuthUrl({ config });
  expect(process.env.AUTH_URL).toBe('https://staging.example.com');
});

test('defaultAuthUrl keeps an AUTH_URL that is already set', () => {
  process.env.AUTH_URL = 'https://auth.example.com';
  defaultAuthUrl({ config });
  expect(process.env.AUTH_URL).toBe('https://auth.example.com');
});

test('defaultAuthUrl leaves NEXTAUTH_URL in charge when it is set', () => {
  process.env.NEXTAUTH_URL = 'https://nextauth.example.com';
  defaultAuthUrl({ config });
  expect(process.env.AUTH_URL).toBeUndefined();
});

test('defaultAuthUrl sets nothing without a current environment url', () => {
  defaultAuthUrl({ config: { environments: config.environments } });
  expect(process.env.AUTH_URL).toBeUndefined();
});
