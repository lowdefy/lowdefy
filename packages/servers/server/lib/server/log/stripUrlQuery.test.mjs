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

import stripUrlQuery from './stripUrlQuery.js';

test('stripUrlQuery drops the query string from an absolute URL', () => {
  expect(
    stripUrlQuery(
      'https://app.example.com/api/auth/magic-link/verify?token=abc123&callbackURL=%2Fhome'
    )
  ).toEqual('https://app.example.com/api/auth/magic-link/verify');
});

test('stripUrlQuery drops the fragment as well', () => {
  expect(stripUrlQuery('https://app.example.com/user-account/magic-link#token=abc123')).toEqual(
    'https://app.example.com/user-account/magic-link'
  );
});

test('stripUrlQuery leaves a URL without a query untouched', () => {
  expect(stripUrlQuery('https://app.example.com/oauth-consent')).toEqual(
    'https://app.example.com/oauth-consent'
  );
});

test('stripUrlQuery returns undefined for a missing header', () => {
  expect(stripUrlQuery(undefined)).toBeUndefined();
  expect(stripUrlQuery(null)).toBeUndefined();
  expect(stripUrlQuery('')).toBeUndefined();
});

test('stripUrlQuery still strips the query from a value that is not an absolute URL', () => {
  expect(stripUrlQuery('/oauth-select-organization?state=xyz&sig=abc')).toEqual(
    '/oauth-select-organization'
  );
  expect(stripUrlQuery('not a url')).toEqual('not a url');
});
