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

import redactUrlQuery from './redactUrlQuery.js';

test('redactUrlQuery redacts the magic-link token and keeps the other parameters', () => {
  expect(
    redactUrlQuery(
      'https://app.example.com/api/auth/magic-link/verify?token=abc123&callbackURL=%2Fhome'
    )
  ).toEqual(
    'https://app.example.com/api/auth/magic-link/verify?token=%5Bredacted%5D&callbackURL=%2Fhome'
  );
});

test('redactUrlQuery redacts the signed OAuth state, sig and code', () => {
  expect(
    redactUrlQuery('https://app.example.com/oauth-consent?client_id=app&state=xyz&sig=abc&code=q')
  ).toEqual(
    'https://app.example.com/oauth-consent?client_id=app&state=%5Bredacted%5D&sig=%5Bredacted%5D&code=%5Bredacted%5D'
  );
});

test('redactUrlQuery matches credential names case-insensitively and by fragment', () => {
  expect(
    redactUrlQuery(
      'https://bucket.s3.amazonaws.com/uploads/file.pdf?X-Amz-Credential=AKIA&X-Amz-Signature=deadbeef&X-Amz-Expires=300&access_token=t&client_secret=s'
    )
  ).toEqual(
    'https://bucket.s3.amazonaws.com/uploads/file.pdf?X-Amz-Credential=%5Bredacted%5D&X-Amz-Signature=%5Bredacted%5D&X-Amz-Expires=300&access_token=%5Bredacted%5D&client_secret=%5Bredacted%5D'
  );
});

test('redactUrlQuery leaves an ordinary page query untouched', () => {
  expect(redactUrlQuery('https://app.example.com/orders?status=open&page=2')).toEqual(
    'https://app.example.com/orders?status=open&page=2'
  );
  expect(redactUrlQuery('https://app.example.com/orders')).toEqual(
    'https://app.example.com/orders'
  );
});

test('redactUrlQuery drops the fragment', () => {
  expect(redactUrlQuery('https://app.example.com/callback?page=1#access_token=abc')).toEqual(
    'https://app.example.com/callback?page=1'
  );
});

test('redactUrlQuery returns undefined for a missing header', () => {
  expect(redactUrlQuery(undefined)).toBeUndefined();
  expect(redactUrlQuery(null)).toBeUndefined();
  expect(redactUrlQuery('')).toBeUndefined();
});

test('redactUrlQuery redacts a value that is not an absolute URL', () => {
  expect(redactUrlQuery('/oauth-select-organization?state=xyz&sig=abc&org=acme')).toEqual(
    '/oauth-select-organization?state=%5Bredacted%5D&sig=%5Bredacted%5D&org=acme'
  );
  expect(redactUrlQuery('not a url')).toEqual('not a url');
});
