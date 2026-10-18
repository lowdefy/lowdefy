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

// The router href for a link the core follows ({ pathname, query }). A link to a tab's own page
// switches to that tab, rather than stacking another copy of the page on the current one.
function toRouterHref({ pathname, query, root }) {
  const search = query ? `?${query}` : '';
  const frame = getFrame(root?.menus);
  if (frame.kind === 'tabs') {
    const path = pathname.replace(/^\//, '');
    const slotIndex = frame.items.findIndex(
      (item) => root.pageIndex.find((entry) => entry.pageId === item.pageId)?.path === path
    );
    if (slotIndex !== -1) {
      return `/(t${slotIndex})${search}`;
    }
  }
  return `${pathname}${search}`;
}

export default toRouterHref;
