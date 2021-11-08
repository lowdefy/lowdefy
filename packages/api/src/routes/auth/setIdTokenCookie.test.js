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
import setIdTokenCookie from './setIdTokenCookie.js';

const setHeader = jest.fn();

test('setIdTokenCookie https', () => {
  setIdTokenCookie(testContext({ protocol: 'https', setHeader }), {
    idToken: 'idToken',
  });
  expect(setHeader.mock.calls).toEqual([
    ['Set-Cookie', 'idToken=idToken; Path=/; Secure; SameSite=Lax'],
  ]);
});

test('setIdTokenCookie http', () => {
  setIdTokenCookie(testContext({ protocol: 'http', setHeader }), {
    idToken: 'idToken',
  });
  expect(setHeader.mock.calls).toEqual([['Set-Cookie', 'idToken=idToken; Path=/; SameSite=Lax']]);
});
