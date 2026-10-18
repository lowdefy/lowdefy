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

import getAuthView from './getAuthView.js';
import shouldLock from './shouldLock.js';

const settings = { emailCode: true, unlock: 'none', unlockAfter: 300, sharedDevice: false };
const ready = { status: 'ready', root: { auth: settings } };

test('getAuthView shows the lock screen before anything else', () => {
  expect(getAuthView({ auth: { status: 'locked', hasToken: true }, session: ready })).toBe('lock');
});

test('getAuthView waits while the token is read', () => {
  expect(getAuthView({ auth: { status: 'starting', hasToken: false }, session: ready })).toBe(
    'loading'
  );
});

test('getAuthView asks for sign-in when the app has auth and nobody is signed in', () => {
  expect(getAuthView({ auth: { status: 'open', hasToken: false }, session: ready })).toBe('signIn');
  expect(getAuthView({ auth: { status: 'open', hasToken: true }, session: ready })).toBe('app');
});

test('getAuthView opens an app without auth, and leaves loading and errors to the app', () => {
  const open = { status: 'open', hasToken: false };
  expect(getAuthView({ auth: open, session: { status: 'ready', root: { auth: null } } })).toBe(
    'app'
  );
  expect(getAuthView({ auth: open, session: { status: 'loading', root: null } })).toBe('app');
  expect(getAuthView({ auth: open, session: { status: 'error', root: null } })).toBe('app');
});

test('shouldLock locks after unlockAfter seconds in the background, not before', () => {
  expect(shouldLock({ backgroundedAt: null, now: 1e9, unlockAfter: 0 })).toBe(false);
  expect(shouldLock({ backgroundedAt: 1000, now: 300_999, unlockAfter: 300 })).toBe(false);
  expect(shouldLock({ backgroundedAt: 1000, now: 301_000, unlockAfter: 300 })).toBe(true);
  expect(shouldLock({ backgroundedAt: 1000, now: 1000, unlockAfter: 0 })).toBe(true);
});
