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
import { render, screen } from '@testing-library/react-native';

import ShellRoot from './ShellRoot.js';

const mockShell = {
  id: 'field',
  name: 'Field',
  environment: 'production',
  app: { id: 'field', name: 'Field', urls: { production: 'https://field.example.com' } },
};

// The opened app is recorded, not built: its auth, session and screens have their own tests.
const mockOpened = [];
jest.mock('./AppProvider.js', () => {
  function AppProvider({ children, shell }) {
    mockOpened.push(shell);
    return children;
  }
  return AppProvider;
});
jest.mock('./Frame.js', () => {
  const { Text: MockText } = jest.requireActual('react-native');
  return () => <MockText testID="frame">frame</MockText>;
});
jest.mock('../config/getShellConfig.js', () => () => mockShell);
// No app is remembered between launches: there is only one to open.
jest.mock('../host/createDeviceStore.js', () => () => {
  throw new Error('ShellRoot reads no device store.');
});

beforeEach(() => {
  mockOpened.length = 0;
});

test('the shell opens its one app at once, with no app picker', async () => {
  await render(<ShellRoot />);
  expect(screen.getByTestId('frame')).toBeTruthy();
  expect(mockOpened.length).toBeGreaterThan(0);
  mockOpened.forEach((shell) => {
    expect(shell).toBe(mockShell);
    expect(shell.app.id).toBe('field');
  });
  expect(screen.queryByTestId('app-field')).toBeNull();
});
