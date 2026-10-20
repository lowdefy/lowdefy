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

const RETRY_MS = 300;
const MAX_TRIES = 100;

/**
 * Runs one of the app's mobile.events (onNotification, onNotificationAction, onShare, onShortcut,
 * onGeofence, onRequestQueue) with an event object. The app context is made when the first page
 * renders, so an event that arrives before it (a notification tap that launched the app) waits for
 * it, trying every 300 ms for up to 30 seconds. Never throws: an app event's failure is reported by
 * the engine's own error handling.
 *
 * @param {Object} params
 * @param {Object} params.session The app session (createAppSession).
 */
function createAppEventTrigger({ session }) {
  return function triggerAppEvent({ name, event }) {
    let tries = 0;
    return new Promise((resolve) => {
      function attempt() {
        const appContext = session.getState().lowdefy?.appContext;
        if (appContext === undefined || appContext === null) {
          tries += 1;
          if (tries > MAX_TRIES) {
            resolve(null);
            return;
          }
          setTimeout(attempt, RETRY_MS);
          return;
        }
        Promise.resolve(appContext._internal.triggerPageEvent({ name, event }))
          .catch(() => null)
          .then(resolve);
      }
      attempt();
    });
  };
}

export default createAppEventTrigger;
