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

import generateSitemap from './generateSitemap.js';
import buildSearchIndex from './buildSearchIndex.js';
import checkOrphans from './checkOrphans.js';
import prevNextBlocks from './prevNextBlocks.js';

/*
  Menu transformer — single source of truth for per-page navigation state.

  This module runs as the `_ref` transformer on pages.yaml, after all nested
  refs, njk templates, and _var values have resolved. Computed values can
  therefore not be consumed as template vars; instead one walk over the menus
  derives, per pageId:
    - tab            → written to the PageSiderMenu block's menu.menuId, and
                       seeded into state (tab_selector) via an injected
                       onInit SetState for the header SegmentedSelector
    - breadcrumbTrail → appended (with the page title) to the PageSiderMenu
                       breadcrumb list after the version entry
    - prev / next    → injected as a footer strip into the max_width box
    - sectionTrail   → handed to buildSearchIndex for per-hit breadcrumbs

  MenuLinks with a url instead of a pageId (external links) render in the
  sidebar but have no page: they are skipped for the pageId map, the
  prev/next order, and the orphan check.
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

function applyToPage(page, record) {
  const sider = (page.blocks ?? []).find((block) => block.type === 'PageSiderMenu');
  if (!sider) return; // 404, future blog pages — no sidebar chrome to wire.

  sider.properties = sider.properties ?? {};
  sider.properties.menu = {
    ...(sider.properties.menu ?? {}),
    menuId: `menu-${record?.tab ?? 'learn'}`,
  };

  page.events = page.events ?? {};
  page.events.onInit = page.events.onInit ?? [];
  page.events.onInit.push({
    id: 'set_active_tab',
    type: 'SetState',
    params: { tab_selector: record?.tab ?? 'learn' },
  });

  if (!record) return; // Orphans render no breadcrumb trail or prev/next.

  const breadcrumbList = sider.properties.breadcrumb?.list;
  if (Array.isArray(breadcrumbList)) {
    breadcrumbList.push(...record.trail, sider.properties.title ?? record.title);
  }

  const maxWidth = sider.slots?.content?.blocks?.find((block) => block.id === 'max_width');
  if (Array.isArray(maxWidth?.blocks)) {
    maxWidth.blocks.push(prevNextBlocks({ prev: record.prev, next: record.next }));
  }
}

function transformer(pages, vars) {
  const { records, membershipCounts } = walkMenus(vars.menus);

  pages.filter(Boolean).forEach((page) => {
    applyToPage(page, records.get(page.id));
  });

  checkOrphans({ pages, membershipCounts });
  generateSitemap(pages);
  buildSearchIndex(pages, records);
  return pages;
}

export default transformer;
