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
import { render } from '@testing-library/react-native';

import { createRoot } from '../test/fixtures.js';
import PathRoute from '../../app/(t0,t1,t2,t3,t4)/[...path].js';

const mockRouter = { canDismiss: jest.fn(() => true), dismiss: jest.fn(), navigate: jest.fn() };
const mockParams = {};

jest.mock('expo-router', () => ({
  get router() {
    return mockRouter;
  },
  useLocalSearchParams: () => mockParams,
}));

const mockState = { root: null };
jest.mock('../ShellContext.js', () => ({
  useSessionState: () => mockState,
}));

jest.mock('./PageScreen.js', () => {
  const { createElement } = jest.requireActual('react');
  return (props) => createElement('PageScreen', props);
});

beforeEach(() => {
  mockState.root = createRoot();
  Object.keys(mockParams).forEach((key) => delete mockParams[key]);
});

// A link the app is opened with, such as /jobs, is matched in the first tab group's stack.
test('a tab page opened on another tab stack is shown on its own tab', async () => {
  Object.assign(mockParams, { path: ['jobs'], status: 'open' });
  const view = await render(<PathRoute />);
  expect(view.toJSON()).toBeNull();
  expect(mockRouter.dismiss).toHaveBeenCalledTimes(1);
  expect(mockRouter.navigate.mock.calls).toEqual([['/(t1)?status=open']]);
});

test('a page no tab shows is stacked on the tab it was opened on', async () => {
  Object.assign(mockParams, { path: ['jobs', '12'] });
  const view = await render(<PathRoute />);
  expect(view.toJSON().props).toEqual({ path: 'jobs/12', query: '' });
  expect(mockRouter.navigate).not.toHaveBeenCalled();
});
