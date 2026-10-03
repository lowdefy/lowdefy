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

import actionsCoreTypes from '@lowdefy/actions-core/types';

import authEngineActions from './authEngineActions.js';

// Every actions-core action that does not call the auth engine. A new action
// type fails the test below until it is added here or to authEngineActions.
const NOT_AUTH_ENGINE = [
  'CallAPI',
  'CallMethod',
  'CopyToClipboard',
  'DisplayMessage',
  'Fetch',
  'GeolocationCurrentPosition',
  'GetLocalStorage',
  'Link',
  'Publish',
  'RemoveLocalStorage',
  'Request',
  'Reset',
  'ResetValidation',
  'ScrollTo',
  'SetDarkMode',
  'SetFocus',
  'SetGlobal',
  'SetLocale',
  'SetLocalStorage',
  'SetState',
  'Subscribe',
  'Throw',
  'Unsubscribe',
  'Validate',
  'Wait',
];

test('every actions-core action type is classified as calling the auth engine or not', () => {
  const unclassified = actionsCoreTypes.actions.filter(
    (actionType) => !authEngineActions.has(actionType) && !NOT_AUTH_ENGINE.includes(actionType)
  );
  expect(unclassified).toEqual([]);
});

test('authEngineActions and the list of the rest name only actions-core action types, once', () => {
  const known = new Set(actionsCoreTypes.actions);
  expect([...authEngineActions].filter((actionType) => !known.has(actionType))).toEqual([]);
  expect(NOT_AUTH_ENGINE.filter((actionType) => !known.has(actionType))).toEqual([]);
  expect(NOT_AUTH_ENGINE.filter((actionType) => authEngineActions.has(actionType))).toEqual([]);
});

test('authEngineActions holds the sign-in, sign-up and session actions', () => {
  ['Login', 'Logout', 'SignUp', 'TwoFactorVerify', 'PasskeySignIn', 'EmailOtpSend'].forEach(
    (actionType) => expect(authEngineActions.has(actionType)).toBe(true)
  );
});
