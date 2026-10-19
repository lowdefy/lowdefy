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
import OAuthContinue from './OAuthContinue.js';

const mockOauth2Continue = jest.fn();
const methods = { oauth2Continue: mockOauth2Continue };

test('OAuthContinue calls the oauth2Continue method with its params', async () => {
  await OAuthContinue({ methods, params: {} });
  expect(mockOauth2Continue.mock.calls).toEqual([[{}]]);
});

test('OAuthContinue returns the result of the oauth2Continue method', async () => {
  const result = { redirect: true, url: 'https://app.example.com/oauth-consent?client_id=abc' };
  mockOauth2Continue.mockResolvedValueOnce(result);
  const data = await OAuthContinue({ methods, params: undefined });
  expect(data).toEqual(result);
});
