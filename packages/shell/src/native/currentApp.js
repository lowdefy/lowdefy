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

// The app the shell has open, for native work that starts outside React: a notification button
// pressed with the app in the background, a background fetch, a geofence crossing. AppProvider sets
// it once the app's auth and session exist; work started before then waits for it.
let current = null;
let waiting = [];

/**
 * @param {Object|null} app { apiBase, auth, fetch, router, session, shell, tokenStore,
 *   triggerAppEvent }, or null when the app closes (a sign-out opens it afresh).
 */
function setCurrentApp(app) {
  current = app;
  if (app !== null) {
    waiting.splice(0).forEach((resolve) => resolve(app));
  }
}

// The open app, once there is one.
function getCurrentApp() {
  if (current !== null) {
    return Promise.resolve(current);
  }
  return new Promise((resolve) => {
    waiting.push(resolve);
  });
}

// The open app, or null: for work that only makes sense while one is open.
function peekCurrentApp() {
  return current;
}

export { getCurrentApp, peekCurrentApp, setCurrentApp };
