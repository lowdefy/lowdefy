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

import { expect, test } from 'vitest';
import isNativeAuthRequest from './isNativeAuthRequest.js';

function request(headers) {
  return new Request('http://localhost/api/auth/sign-in/email-otp', { headers });
}

test('isNativeAuthRequest is true for an HTTP request with no Origin and no Cookie', () => {
  expect(isNativeAuthRequest({ request: request({ authorization: 'Bearer abc.def' }) })).toBe(true);
});

test('isNativeAuthRequest is false for a request with an Origin', () => {
  expect(isNativeAuthRequest({ request: request({ origin: 'http://localhost' }) })).toBe(false);
});

test('isNativeAuthRequest is false for a request with cookies', () => {
  expect(isNativeAuthRequest({ request: request({ cookie: 'a=b' }) })).toBe(false);
});

test('isNativeAuthRequest is false for a server-side auth.api call, which has no request', () => {
  expect(isNativeAuthRequest({ request: undefined })).toBe(false);
});
