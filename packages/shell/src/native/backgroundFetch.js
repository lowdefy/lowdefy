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

import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { type } from '@lowdefy/helpers';

import callEndpoint from './callEndpoint.js';
import { getCurrentApp } from './currentApp.js';
import refreshWidgets from '../widgets/refreshWidgets.js';
import reportShellError from '../host/reportShellError.js';

const TASK = 'lowdefy-background-fetch';

/**
 * One background fetch run, with the app closed: calls mobile.background.endpointId with
 * { reason: 'background' } and applies its answer ({ badge?, refreshWidgets? }), sends the offline
 * queue and refreshes the cached root and pages. No page or app event runs.
 *
 * @param {Object} app The open app (currentApp.js).
 */
async function runBackgroundFetch(app) {
  const background = app.session.getState().root?.background;
  if (type.isNone(background)) {
    return;
  }
  const answer = await callEndpoint({
    app,
    endpointId: background.endpointId,
    payload: { reason: 'background' },
  });
  if (type.isNumber(answer?.badge)) {
    await Notifications.setBadgeCountAsync(answer.badge);
  }
  await Promise.all([
    app.requestQueue.replay(),
    app.session.sync(),
    answer?.refreshWidgets === false ? null : refreshWidgets(),
  ]);
}

// Defined when the bundle loads, so a launch in the background finds it.
TaskManager.defineTask(TASK, async () => {
  const app = await getCurrentApp();
  try {
    await runBackgroundFetch(app);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    reportShellError({ error, session: app.session });
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Registers background fetch while the app's root has mobile.background, at its interval in
 * minutes (the phone decides the real timing), and unregisters it otherwise.
 *
 * @param {Object} params
 * @param {Object} params.app The open app (currentApp.js).
 * @returns {() => void} Stops following the root.
 */
function startBackgroundFetch({ app }) {
  let applied;
  async function applyRoot() {
    const background = app.session.getState().root?.background ?? null;
    if (background === applied) return;
    applied = background;
    const registered = await TaskManager.isTaskRegisteredAsync(TASK);
    if (background === null) {
      if (registered) await BackgroundTask.unregisterTaskAsync(TASK);
      return;
    }
    await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: background.interval });
  }
  const unsubscribe = app.session.subscribe(() => {
    applyRoot().catch(() => {});
  });
  applyRoot().catch(() => {});
  return unsubscribe;
}

export { runBackgroundFetch };
export default startBackgroundFetch;
