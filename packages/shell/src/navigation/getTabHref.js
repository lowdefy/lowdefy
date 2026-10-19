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

import getFrame from './getFrame.js';

/**
 * The router href of the tab whose page is at `path`, with the query as the tab's params, or null
 * when no tab shows that page (a stack or drawer frame, or a page no tab has). A tab's own page is
 * shown on its tab, never stacked on another tab's screens, so the tab bar shows the tab that
 * holds the page on screen.
 *
 * @param {Object} params
 * @param {string} params.path The page path, without the leading "/".
 * @param {string} [params.query] The query string, without "?".
 * @param {Object} params.root The app's mobile root.
 * @returns {string|null}
 */
function getTabHref({ path, query, root }) {
  const frame = getFrame(root?.menus);
  if (frame.kind !== 'tabs') {
    return null;
  }
  const slotIndex = frame.items.findIndex(
    (item) => root.pageIndex.find((entry) => entry.pageId === item.pageId)?.path === path
  );
  if (slotIndex === -1) {
    return null;
  }
  return `/(t${slotIndex})${query ? `?${query}` : ''}`;
}

export default getTabHref;
