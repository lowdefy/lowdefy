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

import matchPagePath from '@lowdefy/node-utils/matchPagePath.js';

import encodePagePath from '../../sync/encodePagePath.js';

/**
 * The dev server rebuilt the app: refetch the root and the page on screen, then rebuild every
 * screen with empty page state, as a browser tab does on a reload. The shell stays on the page it
 * shows.
 *
 * @param {Object} params
 * @param {Object} params.session The app session (createAppSession).
 */
async function reloadApp({ session }) {
  const { root } = session.getState();
  const path = session.getCurrentPath().replace(/^\//, '').split('?')[0];
  const match =
    root === null ? null : matchPagePath({ routes: root.pageIndex, path: encodePagePath(path) });
  if (match !== null) {
    const entry = root.pageIndex.find((indexEntry) => indexEntry.pageId === match.pageId);
    await session.loadPage({ entry, path });
  }
  // Syncs the root, then starts a new generation: new page contexts on the current route.
  await session.handleBuildChanged();
}

export default reloadApp;
