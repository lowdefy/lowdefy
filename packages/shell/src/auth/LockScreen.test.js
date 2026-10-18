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

import React from 'react';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import LockScreen from './LockScreen.js';

test('the lock screen asks to unlock at once, and again on Unlock', async () => {
  const auth = { unlock: jest.fn(async () => false), signOut: jest.fn() };
  await render(<LockScreen appName="Field" auth={auth} />);
  expect(screen.getByText('Field')).toBeTruthy();
  expect(auth.unlock).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByTestId('lock-unlock'));
  expect(auth.unlock).toHaveBeenCalledTimes(2);
});

test('Sign in again signs out', async () => {
  const auth = { unlock: jest.fn(async () => false), signOut: jest.fn() };
  await render(<LockScreen appName="Field" auth={auth} />);
  await fireEvent.press(screen.getByTestId('lock-sign-in-again'));
  expect(auth.signOut).toHaveBeenCalledTimes(1);
});
