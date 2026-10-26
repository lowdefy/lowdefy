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
import { Linking } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import OtherPageScreen from './OtherPageScreen.js';
import ShellContext from '../ShellContext.js';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: jest.fn(), replace: jest.fn() },
}));

function renderScreen(result = { surface: 'web' }) {
  const session = {
    apiBase: 'https://app.test',
    fetchOtherPage: jest.fn().mockResolvedValue(result),
  };
  return render(
    <ShellContext.Provider value={{ session }}>
      <OtherPageScreen path="reports" query="id=7" />
    </ShellContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});

test('a cold start opens the web page with its query and offers home, going nowhere on its own', async () => {
  router.canGoBack.mockReturnValue(false);
  await renderScreen();
  expect(await screen.findByTestId('shell-opened-in-browser')).toBeTruthy();
  expect(Linking.openURL).toHaveBeenCalledWith('https://app.test/reports?id=7');
  expect(router.back).not.toHaveBeenCalled();
  // Home could be this web-only page, which would open the browser again.
  expect(router.replace).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('Go home'));
  expect(router.replace).toHaveBeenCalledWith('/');
});

test('with history it goes back after opening the browser', async () => {
  router.canGoBack.mockReturnValue(true);
  await renderScreen();
  await waitFor(() => expect(router.back).toHaveBeenCalled());
  expect(router.replace).not.toHaveBeenCalled();
});

test('a failed openURL shows the not-found message, not a spinner', async () => {
  Linking.openURL.mockRejectedValue(new Error('no browser'));
  await renderScreen();
  expect(await screen.findByTestId('shell-not-found')).toBeTruthy();
});
