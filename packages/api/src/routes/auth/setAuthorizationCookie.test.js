/*
  Copyright 2020-2021 Lowdefy, Inc

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

import testContext from '../../test/testContext.js';
import setAuthorizationCookie from './setAuthorizationCookie.js';

const setHeader = jest.fn();

test('setAuthorizationCookie https', () => {
  setAuthorizationCookie(testContext({ protocol: 'https', setHeader }), {
    accessToken: 'accessToken',
  });
  expect(setHeader.mock.calls).toEqual([
    ['Set-Cookie', 'authorization=accessToken; Path=/; HttpOnly; Secure; SameSite=Lax'],
  ]);
});

test('setAuthorizationCookie http', () => {
  setAuthorizationCookie(testContext({ protocol: 'http', setHeader }), {
    accessToken: 'accessToken',
  });
  expect(setHeader.mock.calls).toEqual([
    ['Set-Cookie', 'authorization=accessToken; Path=/; HttpOnly; SameSite=Lax'],
  ]);
});
