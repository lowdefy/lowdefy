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
import OAuthConsent from './OAuthConsent.js';

const mockOauth2Consent = jest.fn();
const methods = { oauth2Consent: mockOauth2Consent };

test('OAuthConsent passes params to the oauth2Consent method', async () => {
  await OAuthConsent({ methods, params: { accept: true } });
  expect(mockOauth2Consent.mock.calls).toEqual([[{ accept: true }]]);
});

test('OAuthConsent passes a deny with narrowing params through unchanged', async () => {
  await OAuthConsent({ methods, params: { accept: false, scope: 'openid profile' } });
  expect(mockOauth2Consent.mock.calls).toEqual([[{ accept: false, scope: 'openid profile' }]]);
});

test('OAuthConsent returns the result of the oauth2Consent method', async () => {
  const result = { redirect: true, url: 'https://client.example.com/callback?code=abc' };
  mockOauth2Consent.mockResolvedValueOnce(result);
  const data = await OAuthConsent({ methods, params: { accept: true } });
  expect(data).toEqual(result);
});
