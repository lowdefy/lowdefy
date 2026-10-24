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

// This phone's native push token (APNs or FCM), as registerPushToken sent it; null when the phone
// has none (never allowed to notify, no signal).
async function getDeviceToken() {
  try {
    const { data } = await Notifications.getDevicePushTokenAsync();
    return data ?? null;
  } catch (error) {
    return null;
  }
}

/**
 * Tells the app's mobile.notifications.unregister endpoint that this phone signs out, so no
 * notification for the person reaches it afterwards: { token, platform, shellId }, with the session
 * that is ending, so the app drops this phone's token and keeps the person's other phones. Called
 * before the token is removed, and never waited on: offline, the sign-out still ends on the phone,
 * and the app drops the token when a push to it fails.
 *
 * A session the server already ended (a 401 clears the token, createAppAuth handleTokenChange)
 * has no session left to call with, so nothing is unregistered: the push token stays with the app
 * until a push to it fails or the phone registers for someone else.
 *
 * @param {Object} params
 * @param {Object} params.app { apiBase, fetch, session, shell, tokenStore }.
 */
async function unregisterPushToken({ app }) {
  const endpointId = app.session?.getState().root?.notifications?.unregister;
  if (typeof endpointId !== 'string' || app.tokenStore.get() === null) {
    return;
  }
  await callEndpoint({
    app,
    endpointId,
    payload: { token: await getDeviceToken(), platform: Platform.OS, shellId: app.shell.id },
  });
}

export default unregisterPushToken;
