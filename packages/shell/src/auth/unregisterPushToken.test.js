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

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import callEndpoint from '../native/callEndpoint.js';
import unregisterPushToken from './unregisterPushToken.js';

jest.mock('../native/callEndpoint.js', () => jest.fn(async () => null));
jest.mock('expo-notifications', () => ({
  getDevicePushTokenAsync: jest.fn(async () => ({ data: 'device-token' })),
}));

function createApp({ token = 'session-token' } = {}) {
  return {
    session: { getState: () => ({ root: { notifications: { unregister: 'drop_push' } } }) },
    shell: { id: 'field' },
    tokenStore: { get: () => token },
  };
}

test('a sign-out sends this phone push token, so the app drops that one', async () => {
  await unregisterPushToken({ app: createApp() });
  expect(callEndpoint).toHaveBeenCalledWith(
    expect.objectContaining({
      endpointId: 'drop_push',
      payload: { token: 'device-token', platform: Platform.OS, shellId: 'field' },
    })
  );
});

test('a sign-out that clears the session token while the push token is read still calls with it', async () => {
  const app = createApp();
  let current = 'session-token';
  app.tokenStore = { get: () => current };
  Notifications.getDevicePushTokenAsync.mockImplementationOnce(async () => {
    current = null;
    return { data: 'device-token' };
  });
  await unregisterPushToken({ app });
  expect(callEndpoint.mock.calls[0][0].app.tokenStore.get()).toBe('session-token');
});

test('a phone without a push token sends token null', async () => {
  Notifications.getDevicePushTokenAsync.mockRejectedValueOnce(new Error('not registered'));
  await unregisterPushToken({ app: createApp() });
  expect(callEndpoint.mock.calls[0][0].payload.token).toBeNull();
});

test('a session that already ended unregisters nothing', async () => {
  await unregisterPushToken({ app: createApp({ token: null }) });
  expect(callEndpoint).not.toHaveBeenCalled();
});
