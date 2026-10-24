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
import * as Sharing from 'expo-sharing';

import getPagePath from './getPagePath.js';
import openPath from './openPath.js';
import parseShellLink from './parseShellLink.js';
import toSharePayload from './toSharePayload.js';

/**
 * Items shared into the app (the share extension opens `<scheme>://expo-sharing`): opens
 * mobile.share.pageId with the payload in its query as `shared`, and fires onShare with it. A shell
 * without the share extension never gets the link.
 *
 * @param {Object} params
 * @param {Object} params.app The open app (currentApp.js).
 * @returns {{ receive: () => Promise<void>, stop: () => void }} receive takes what is waiting now,
 *   or the payloads Lowdefy Dev's share injection passes; stop stops listening.
 */
function startShareIn({ app }) {
  async function receive({ payloads: injected } = {}) {
    const payloads = injected ?? (await Sharing.getResolvedSharedPayloadsAsync());
    if (injected === undefined) Sharing.clearSharedPayloads();
    if (payloads.length === 0) return;
    // The share page's path comes from the root.
    await app.ready;
    const shared = toSharePayload(payloads);
    const { root } = app.session.getState();
    if (root?.share !== null && root?.share !== undefined) {
      openPath({ app, path: getPagePath({ pageId: root.share.pageId, root }), query: { shared } });
    }
    app.triggerAppEvent({ name: 'onShare', event: shared });
  }
  function onUrl(url) {
    if (parseShellLink(url)?.kind === 'share') receive().catch(() => {});
  }
  const urls = Linking.addEventListener('url', ({ url }) => onUrl(url));
  Linking.getInitialURL()
    .then(onUrl)
    .catch(() => {});
  return { receive, stop: () => urls.remove() };
}

export default startShareIn;
