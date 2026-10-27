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

import { getSfSymbol } from '@lowdefy/client-native';

/**
 * How each tab of a tabs frame draws its icon: on iOS, an SF Symbol (the item's `sfSymbol`, or
 * the symbol mapped from its Lucide or semantic icon name); otherwise, or for an icon with no
 * symbol, its Lucide icon as an image (TabIconImages), from the icon data the build adds to the
 * item. A tab with no icon has none.
 *
 * @param {Object} params
 * @param {Object[]} params.items The tabs frame's items.
 * @param {string} params.platform Platform.OS.
 * @returns {Object[]} Per item, `{ pageId, sf, iconData }`: `sf` an SF Symbol name or null, and
 *   `iconData` the data to draw as an image, or null.
 */
function getTabIcons({ items, platform }) {
  return items.map((item) => {
    const sf =
      platform === 'ios' ? getSfSymbol({ icon: item.icon, sfSymbol: item.sfSymbol }) : null;
    return {
      iconData: sf === null ? item.iconData ?? null : null,
      pageId: item.pageId,
      sf,
    };
  });
}

export default getTabIcons;
