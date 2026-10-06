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

import getHeadlessUser from './getHeadlessUser.js';

function contextWithCookie(cookie) {
  return { req: { header: (name) => (name === 'cookie' ? cookie : undefined) } };
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64');
}

test('getHeadlessUser reads the user and whether the caller named it', () => {
  const caller = { user: { id: 'agent', roles: ['admin'] }, explicit: true };
  expect(
    getHeadlessUser(contextWithCookie(`other=1; lowdefy_headless_user=${encode(caller)}`))
  ).toEqual(caller);
});

test('getHeadlessUser returns null with no headless cookie', () => {
  expect(getHeadlessUser(contextWithCookie(undefined))).toBeNull();
  expect(getHeadlessUser(contextWithCookie('other=1'))).toBeNull();
});

test('getHeadlessUser returns null for a cookie that is not base64 JSON', () => {
  expect(getHeadlessUser(contextWithCookie('lowdefy_headless_user=%%%'))).toBeNull();
});
