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

// The node-utils matcher is the one the server matches page paths with; this file imports only
// @lowdefy/helpers.
import matchPagePath from '@lowdefy/node-utils/matchPagePath.js';

import encodePagePath from '../sync/encodePagePath.js';
import findMissingPageTypes from '../types/findMissingPageTypes.js';
import isShellTooOld from '../version/isShellTooOld.js';

/**
 * What a screen showing `path` draws, from the session state:
 * - `{ view: 'update', reason }`: the shell is older than minShellVersion, or lacks a type the page
 *   needs ("Update the app to open this page"). Other pages still open.
 * - `{ view: 'other', path }`: no mobile page has this path (a web page, or none).
 * - `{ view: 'loading', entry, pathParams }`: the page is not in the cache yet.
 * - `{ view: 'page', entry, page, pathParams }`: render it.
 *
 * @param {Object} params
 * @param {Object} params.shell The shell config: `version` and `typeManifest`.
 * @param {Object} params.state The session state (createAppSession).
 * @param {string} params.path The route's path, without the leading "/".
 */
function getPageView({ path, shell, state }) {
  const { pages, root } = state;
  if (isShellTooOld({ minShellVersion: root.minShellVersion, shellVersion: shell.version })) {
    return { view: 'update', reason: 'minShellVersion' };
  }
  const match = matchPagePath({ routes: root.pageIndex, path: encodePagePath(path) });
  if (match === null) {
    return { view: 'other', path };
  }
  const entry = root.pageIndex.find((indexEntry) => indexEntry.pageId === match.pageId);
  const page = pages[entry.pageId];
  const missing = findMissingPageTypes({ entry, manifest: shell.typeManifest, page, root });
  if (missing.length > 0) {
    return { view: 'update', reason: 'types', missing };
  }
  if (page === undefined) {
    return { view: 'loading', entry, pathParams: match.pathParams };
  }
  return { view: 'page', entry, page, pathParams: match.pathParams };
}

export default getPageView;
