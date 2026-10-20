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

import callEndpoint from '../native/callEndpoint.js';

/**
 * Tells the app's mobile.notifications.unregister endpoint that this phone signs out, so no
 * notification for the person reaches it afterwards: { platform, shellId }, with the session that
 * is ending. Called before the token is removed, and never waited on: offline, the sign-out still
 * ends on the phone, and the app drops the token when a push to it fails.
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
    payload: { platform: Platform.OS, shellId: app.shell.id },
  });
}

export default unregisterPushToken;
