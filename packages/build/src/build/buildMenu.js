/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { type } from '@lowdefy/helpers';

async function buildDefaultMenu({ components, context }) {
  context.logger.warn('No menus found. Building default menu.');
  const pages = type.isArray(components.pages) ? components.pages : [];
  const menus = [
    {
      id: 'default',
      links: pages.map((page, i) => ({
        id: `${i}`,
        type: 'MenuLink',
        pageId: page.pageId,
        auth: page.auth,
      })),
    },
  ];

  return menus;
}

function loopItems(parent, menuId, pages, missingPageWarnings) {
  if (type.isArray(parent.links)) {
    parent.links.forEach((menuItem) => {
      if (menuItem.type === 'MenuLink') {
        if (type.isString(menuItem.pageId)) {
          const page = pages.find((pg) => pg.pageId === menuItem.pageId);
          if (!page) {
            missingPageWarnings.push({
              menuItemId: menuItem.id,
              pageId: menuItem.pageId,
            });
            // remove menuItem from menu
            menuItem.remove = true;
            return;
          } else {
            menuItem.auth = page.auth;
          }
        }
      }
      menuItem.menuItemId = menuItem.id;
      menuItem.id = `menuitem:${menuId}:${menuItem.id}`;
      loopItems(menuItem, menuId, pages, missingPageWarnings);
    });
    parent.links = parent.links.filter((item) => item.remove !== true);
  }
}

async function buildMenu({ components, context }) {
  const pages = type.isArray(components.pages) ? components.pages : [];
  if (type.isUndefined(components.menus) || components.menus.length === 0) {
    components.menus = await buildDefaultMenu({ components, context });
  }
  const missingPageWarnings = [];
  components.menus.forEach((menu) => {
    menu.menuId = menu.id;
    menu.id = `menu:${menu.id}`;
    loopItems(menu, menu.menuId, pages, missingPageWarnings);
  });
  await Promise.all(
    missingPageWarnings.map(async (warning) => {
      await context.logger.warn(
        `Page "${warning.pageId}" referenced in menu link "${warning.menuItemId}" not found.`
      );
    })
  );
  return components;
}

export default buildMenu;
