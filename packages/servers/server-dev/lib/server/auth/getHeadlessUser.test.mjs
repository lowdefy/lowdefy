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

import getHeadlessUser from './getHeadlessUser.js';
import JOURNEY_COOKIES from '../journeyCookies/JOURNEY_COOKIES.js';
import writeJourneyCookie from '../journeyCookies/writeJourneyCookie.js';

const caller = { user: { id: 'agent', roles: ['admin'] }, explicit: true };

function contextWithCookie(cookie, headers = {}) {
  const all = { ...headers, cookie };
  return { req: { header: (name) => all[name] } };
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64');
}

function signedCookie(value) {
  const { name, value: signed } = writeJourneyCookie({
    name: JOURNEY_COOKIES.headlessUser.name,
    payload: encode(value),
    origin: 'http://localhost:3000',
  });
  return `${name}=${signed}`;
}

test('getHeadlessUser reads the user and whether the caller named it from a signed cookie', () => {
  expect(getHeadlessUser(contextWithCookie(`other=1; ${signedCookie(caller)}`))).toEqual(caller);
});

test('getHeadlessUser returns null with no headless cookie', () => {
  expect(getHeadlessUser(contextWithCookie(undefined))).toBeNull();
  expect(getHeadlessUser(contextWithCookie('other=1'))).toBeNull();
});

test('getHeadlessUser refuses an unsigned headless cookie', () => {
  expect(getHeadlessUser(contextWithCookie(`lowdefy_headless_user=${encode(caller)}`))).toBeNull();
});

test('getHeadlessUser refuses a headless cookie signed with another token', () => {
  const forgedToken = 'f'.repeat(64);
  expect(
    getHeadlessUser(contextWithCookie(`lowdefy_headless_user=${forgedToken}.${encode(caller)}`))
  ).toBeNull();
});

test('getHeadlessUser refuses a headless cookie whose token was cut short', () => {
  const [, signed] = signedCookie(caller).split('=');
  const token = signed.slice(0, signed.indexOf('.'));
  expect(
    getHeadlessUser(
      contextWithCookie(`lowdefy_headless_user=${token.slice(0, 10)}.${encode(caller)}`)
    )
  ).toBeNull();
});

test('getHeadlessUser returns null for a signed cookie whose payload is not base64 JSON', () => {
  const { value } = writeJourneyCookie({
    name: JOURNEY_COOKIES.headlessUser.name,
    payload: '%%%',
    origin: 'http://localhost:3000',
  });
  expect(getHeadlessUser(contextWithCookie(`lowdefy_headless_user=${value}`))).toBeNull();
});

test('getHeadlessUser ignores a signed headless cookie on a request from another machine', () => {
  expect(
    getHeadlessUser(contextWithCookie(signedCookie(caller), { 'x-lowdefy-dev-remote': '1' }))
  ).toBeNull();
});
