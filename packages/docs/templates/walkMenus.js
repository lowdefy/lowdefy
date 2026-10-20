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

/*
  One walk over the menus derives, per pageId:
    - tab / tabTitle  → which top tab the page belongs to
    - trail           → ancestor MenuGroup titles from the top tab down
    - prev / next     → flattened-order siblings in the same menu

  MenuLinks with a url instead of a pageId (external links) render in the
  sidebar but have no page: they are skipped for the pageId map, the
  prev/next order, and the orphan check.

  Shared by navFromMenus.js (per-page nav refs) and generateSiteAssets.js
  (search index + orphan check).
*/
function walkMenus(menus) {
  const records = new Map();
  const membershipCounts = new Map();

  (menus ?? []).forEach((menu) => {
    const tab = (menu.id ?? '').replace(/^menu-/, '');
    const tabTitle = menu.properties?.title ?? tab;
    const order = [];

    function walkLinks(links, trail) {
      (links ?? []).forEach((link) => {
        if (link.type === 'MenuGroup') {
          walkLinks(link.links, [...trail, link.properties?.title ?? link.id]);
        } else if (link.type === 'MenuLink' && link.pageId) {
          order.push({
            pageId: link.pageId,
            title: link.properties?.title ?? link.pageId,
            trail,
          });
        }
      });
    }
    walkLinks(menu.links, [tabTitle]);

    order.forEach((item, index) => {
      membershipCounts.set(item.pageId, (membershipCounts.get(item.pageId) ?? 0) + 1);
      records.set(item.pageId, {
        tab,
        tabTitle,
        title: item.title,
        trail: item.trail,
        prev: order[index - 1] ?? null,
        next: order[index + 1] ?? null,
      });
    });
  });

  return { records, membershipCounts };
}

export default walkMenus;
