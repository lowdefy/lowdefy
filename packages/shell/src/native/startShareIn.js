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

import clearShareFolder from './clearShareFolder.js';
import copySharedFiles from './copySharedFiles.js';
import getPagePath from './getPagePath.js';
import openPath from './openPath.js';
import parseShellLink from './parseShellLink.js';
import reportShellError from '../host/reportShellError.js';
import toSharePayload from './toSharePayload.js';

// What is waiting in expo-sharing, with its files copied to the shell's share folder before it is
// cleared: clearing deletes expo-sharing's copies, which the share page and onShare still read.
async function takeSharedPayload() {
  const payloads = await Sharing.getResolvedSharedPayloadsAsync();
  try {
    const shared = toSharePayload(payloads);
    return { ...shared, files: await copySharedFiles({ files: shared.files }) };
  } finally {
    Sharing.clearSharedPayloads();
  }
}

function isEmpty(shared) {
  return shared.text === null && shared.urls.length === 0 && shared.files.length === 0;
}

/**
 * Items shared into the app (the share extension opens `<scheme>://expo-sharing`): opens
 * mobile.share.pageId with the payload in its query as `shared`, and fires onShare with it. Shared
 * files are copies in the shell's share folder (copySharedFiles.js), which is emptied each time the
 * app opens. A shell without the share extension never gets the link.
 *
 * @param {Object} params
 * @param {Object} params.app The open app (currentApp.js).
 * @returns {{ receive: () => Promise<void>, stop: () => void }} receive takes what is waiting now,
 *   or the payloads Lowdefy Dev's share injection passes; stop stops listening.
 */
function startShareIn({ app }) {
  try {
    clearShareFolder();
  } catch (error) {
    // Old copies left in the cache must not stop the app opening.
    reportShellError({ error, session: app.session });
  }
  async function receive({ payloads: injected } = {}) {
    // Injected files are the developer's own and nothing deletes them, so they are not copied.
    const shared = injected === undefined ? await takeSharedPayload() : toSharePayload(injected);
    if (isEmpty(shared)) return;
    // The share page's path comes from the root.
    await app.ready;
    const { root } = app.session.getState();
    if (root?.share !== null && root?.share !== undefined) {
      openPath({ app, path: getPagePath({ pageId: root.share.pageId, root }), query: { shared } });
    }
    app.triggerAppEvent({ name: 'onShare', event: shared });
  }
  function onUrl(url) {
    if (parseShellLink(url)?.kind !== 'share') return;
    receive().catch((error) => reportShellError({ error, session: app.session }));
  }
  const urls = Linking.addEventListener('url', ({ url }) => onUrl(url));
  Linking.getInitialURL()
    .then(onUrl)
    .catch(() => {});
  return { receive, stop: () => urls.remove() };
}

export default startShareIn;
