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

// The Expo push token, for an app that sends through Expo's push service. A shell without an EAS
// project has none.
async function getExpoToken(projectId) {
  if (typeof projectId !== 'string') {
    return null;
  }
  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Sends this phone's push token to the app's mobile.notifications.register endpoint, once signed in
 * and allowed to notify: { token (APNs or FCM), expoToken, platform, provider, shellId,
 * appVersion }. The app stores it per user (the endpoint has the caller's session) and sends pushes
 * through APNs, FCM or Expo. Does nothing without a register endpoint or permission.
 *
 * @param {Object} params
 * @param {Object} params.app The open app (currentApp.js).
 * @param {string} [params.token] A new native token (the token listener), else read now.
 */
async function registerPushToken({ app, token }) {
  const endpointId = app.session.getState().root?.notifications?.register;
  if (typeof endpointId !== 'string' || app.tokenStore.get() === null) {
    return null;
  }
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) {
    return null;
  }
  const nativeToken = token ?? (await Notifications.getDevicePushTokenAsync()).data;
  const registration = {
    token: nativeToken,
    expoToken: await getExpoToken(app.shell.easProjectId),
    platform: Platform.OS,
    provider: Platform.OS === 'ios' ? 'apns' : 'fcm',
    shellId: app.shell.id,
    appVersion: app.shell.version,
  };
  await callEndpoint({ app, endpointId, payload: registration });
  return registration;
}

export default registerPushToken;
