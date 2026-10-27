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

import { Linking } from 'react-native';

import openPath from './openPath.js';
import startShortcuts from './startShortcuts.js';

jest.mock('./openPath.js', () => jest.fn());
// The app was launched from the New job quick action.
jest.mock('expo-quick-actions', () => ({
  initial: { id: 'new_job' },
  setItems: async () => undefined,
  addListener: () => ({ remove: () => undefined }),
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function createApp() {
  const root = { shortcuts: [{ id: 'new_job', title: 'New job', path: '/jobs/new', icon: null }] };
  return {
    ready: Promise.resolve(),
    session: { getState: () => ({ root }), subscribe: () => () => undefined },
    triggerAppEvent: jest.fn(),
  };
}

test('the quick action that launched the app runs once, not again after a sign-out', async () => {
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
  const first = createApp();
  const stop = startShortcuts({ app: first });
  await flush();
  expect(openPath).toHaveBeenCalledWith({ app: first, path: '/jobs/new' });
  expect(first.triggerAppEvent).toHaveBeenCalledWith({
    name: 'onShortcut',
    event: { id: 'new_job', title: 'New job' },
  });
  stop();

  const second = createApp();
  startShortcuts({ app: second });
  await flush();
  expect(openPath).toHaveBeenCalledTimes(1);
  expect(second.triggerAppEvent).not.toHaveBeenCalled();
  expect(Linking.getInitialURL).toHaveBeenCalledTimes(1);
});
