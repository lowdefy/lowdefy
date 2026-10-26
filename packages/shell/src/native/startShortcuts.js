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
import * as QuickActions from 'expo-quick-actions';

import openPath from './openPath.js';
import parseShellLink from './parseShellLink.js';

// The quick action or shortcut link that launched the app runs once per launch. The services start
// again after every sign-out, and QuickActions.initial and the initial url stay as they were, so
// the next person to sign in would be sent to the shortcut's page again.
let launchHandled = false;

/**
 * The app icon's quick actions and App Shortcuts, from mobile.shortcuts: set on the phone whenever
 * the root changes (expo-quick-actions, which the App Shortcuts intent reads too). Choosing one,
 * from the icon or from Siri or Spotlight (`<scheme>://shortcut/<id>`), opens its path and fires
 * onShortcut with { id, title }.
 *
 * @param {Object} params
 * @param {Object} params.app The open app (currentApp.js).
 * @returns {() => void} Stops listening.
 */
function startShortcuts({ app }) {
  let applied = null;
  function applyRoot() {
    const shortcuts = app.session.getState().root?.shortcuts;
    if (shortcuts === undefined || shortcuts === applied) return;
    applied = shortcuts;
    QuickActions.setItems(
      shortcuts.map((shortcut) => ({
        id: shortcut.id,
        title: shortcut.title,
        subtitle: shortcut.subtitle,
        icon: shortcut.icon === null ? null : `symbol:${shortcut.icon}`,
      }))
    ).catch(() => {});
  }
  // A quick action that launched the app waits for the root that names its path.
  async function run(id) {
    await app.ready;
    const shortcut = (app.session.getState().root?.shortcuts ?? []).find((item) => item.id === id);
    if (shortcut === undefined) return;
    openPath({ app, path: shortcut.path });
    app.triggerAppEvent({ name: 'onShortcut', event: { id: shortcut.id, title: shortcut.title } });
  }
  function onUrl(url) {
    const link = parseShellLink(url);
    if (link?.kind === 'shortcut') run(link.id).catch(() => {});
  }

  const unsubscribe = app.session.subscribe(applyRoot);
  applyRoot();
  const quickAction = QuickActions.addListener((action) => {
    run(action.id).catch(() => {});
  });
  const urls = Linking.addEventListener('url', ({ url }) => onUrl(url));
  if (!launchHandled) {
    launchHandled = true;
    if (QuickActions.initial !== undefined) {
      run(QuickActions.initial.id).catch(() => {});
    }
    Linking.getInitialURL()
      .then(onUrl)
      .catch(() => {});
  }
  return () => {
    unsubscribe();
    quickAction.remove();
    urls.remove();
  };
}

export default startShortcuts;
