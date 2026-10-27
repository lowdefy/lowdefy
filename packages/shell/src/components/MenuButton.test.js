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

import MenuButton from './MenuButton.js';
import { iosColors, ThemeContext } from '@lowdefy/client-native';
import ShellContext from '../ShellContext.js';

jest.mock('expo-router', () => ({
  router: { canDismiss: () => false, replace: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const house = { node: [['path', { d: 'M3 10a2 2 0 0 1 .709-1.528l7-6' }]] };

test('the drawer menu draws each item icon from the icon data the root carries', async () => {
  const state = { root: { pageIndex: [{ pageId: 'today', path: 'today' }] } };
  const session = { getState: () => state, subscribe: () => () => undefined };
  await render(
    <ShellContext.Provider value={{ session }}>
      <MenuButton
        items={[
          { pageId: 'today', title: 'Today', icon: 'House', iconData: house },
          { pageId: 'jobs', title: 'Jobs' },
        ]}
      />
    </ShellContext.Provider>
  );
  fireEvent.press(screen.getByTestId('shell-menu'));
  expect(await screen.findByTestId('menu-today-icon')).toBeTruthy();
  expect(screen.queryByTestId('menu-jobs-icon')).toBeNull();
  expect(screen.getByText('Jobs')).toBeTruthy();
});

test('the drawer menu takes the theme tokens in dark mode', async () => {
  const state = { root: { pageIndex: [] } };
  const session = { getState: () => state, subscribe: () => () => undefined };
  const tokens = { ...iosColors.dark, colorTint: '#0A84FF' };
  await render(
    <ThemeContext.Provider value={{ isDark: true, tokens }}>
      <ShellContext.Provider value={{ session }}>
        <MenuButton items={[{ pageId: 'jobs', title: 'Jobs', iconData: house }]} />
      </ShellContext.Provider>
    </ThemeContext.Provider>
  );
  expect(screen.getByText('Menu')).toHaveStyle({ color: '#0A84FF' });
  fireEvent.press(screen.getByTestId('shell-menu'));
  expect(await screen.findByText('Jobs')).toHaveStyle({ color: tokens.colorLabel });
  expect(screen.getByTestId('menu-jobs-icon', { includeHiddenElements: true }).props.color).toBe(
    tokens.colorLabel
  );
  expect(screen.getByText('Jobs').parent.parent.parent).toHaveStyle({
    backgroundColor: tokens.colorGroupedBackground,
  });
});
