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

import * as Notifications from 'expo-notifications';
import { type } from '@lowdefy/helpers';

import handleNotificationResponse from './handleNotificationResponse.js';
import refreshWidgets from '../widgets/refreshWidgets.js';
import registerPushToken from './registerPushToken.js';
import reportShellError from '../host/reportShellError.js';
import toCategoryActions from './toCategoryActions.js';
import toNotificationEvent from './toNotificationEvent.js';

/**
 * Notifications for the open app, once its root is held: registers its categories, shows a
 * notification that arrives while it is open as mobile.notifications.foreground says, fires
 * onNotification for it, handles taps and buttons (handleNotificationResponse, also the one that
 * launched the app), and registers the push token once signed in and allowed. A push with
 * `data.refreshWidgets` updates the widgets.
 *
 * @param {Object} params
 * @param {Object} params.app The open app (currentApp.js).
 * @returns {() => void} Stops listening.
 */
function startNotifications({ app }) {
  const subscriptions = [];
  let registeredCategories = null;
  // The response that launched the app can also reach the listener: each is handled once.
  const handled = new Set();
  function report(error) {
    reportShellError({ error, session: app.session });
  }
  function respond(response) {
    const key = `${response.notification.request.identifier}:${response.actionIdentifier}`;
    if (handled.has(key)) return;
    handled.add(key);
    // A button's endpoint call and the path it opens need the token and the root.
    app.ready.then(() => handleNotificationResponse({ app, response })).catch(report);
  }

  function applyRoot() {
    const notifications = app.session.getState().root?.notifications;
    if (!type.isObject(notifications) || notifications === registeredCategories) {
      return;
    }
    registeredCategories = notifications;
    notifications.categories.forEach((category) => {
      Notifications.setNotificationCategoryAsync(
        category.id,
        toCategoryActions(category.actions)
      ).catch(() => {});
    });
    registerPushToken({ app }).catch(report);
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => {
      const banner = app.session.getState().root?.notifications?.foreground !== 'silent';
      return {
        shouldShowBanner: banner,
        shouldShowList: true,
        shouldPlaySound: banner,
        shouldSetBadge: true,
      };
    },
  });

  subscriptions.push(
    Notifications.addNotificationReceivedListener((notification) => {
      const event = toNotificationEvent(notification);
      if (event.data.refreshWidgets === true) {
        refreshWidgets({ app }).catch(() => {});
      }
      app.triggerAppEvent({ name: 'onNotification', event: { notification: event } });
    }),
    Notifications.addNotificationResponseReceivedListener(respond),
    Notifications.addPushTokenListener(({ data }) => {
      registerPushToken({ app, token: data }).catch(report);
    })
  );
  const unsubscribe = app.session.subscribe(applyRoot);
  applyRoot();
  // A sign-in after the app opened registers the token for the person who signed in.
  const unsubscribeToken = app.tokenStore.subscribe((token) => {
    if (token !== null) registerPushToken({ app }).catch(report);
  });

  const launching = Notifications.getLastNotificationResponse();
  if (launching !== null) {
    Notifications.clearLastNotificationResponse();
    respond(launching);
  }

  return () => {
    unsubscribe();
    unsubscribeToken();
    subscriptions.forEach((subscription) => subscription.remove());
  };
}

export default startNotifications;
