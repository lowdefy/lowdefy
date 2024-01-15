/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2024 Lowdefy, Inc

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
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';

function buildDefaultMenu({ components, context }) {
  context.logger.warn('No menus found. Building default menu.');
  const pages = type.isArray(components.pages) ? components.pages : [];
  const menus = [
    {
      id: 'default',
      links: pages
        .map((page, i) => ({
          id: `${i}`,
          type: 'MenuLink',
          pageId: page.pageId,
          auth: page.auth,
        }))
        .filter((page) => page.pageId !== '404'),
    },
  ];

  return menus;
}

function loopItems({ parent, menuId, pages, missingPageWarnings, checkDuplicateMenuItemId }) {
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
        } else {
          menuItem.auth = { public: true };
        }
      }
      if (menuItem.type === 'MenuGroup') {
        menuItem.auth = { public: true };
      }
      checkDuplicateMenuItemId({ id: menuItem.id, menuId });
      menuItem.menuItemId = menuItem.id;
      menuItem.id = `menuitem:${menuId}:${menuItem.id}`;
      loopItems({ parent: menuItem, menuId, pages, missingPageWarnings, checkDuplicateMenuItemId });
    });
    parent.links = parent.links.filter((item) => item.remove !== true);
  }
}

function buildMenu({ components, context }) {
  const pages = type.isArray(components.pages) ? components.pages : [];
  if (type.isUndefined(components.menus) || components.menus.length === 0) {
    components.menus = buildDefaultMenu({ components, context });
  }
  const missingPageWarnings = [];
  const checkDuplicateMenuId = createCheckDuplicateId({ message: 'Duplicate menuId "{{ id }}".' });
  components.menus.forEach((menu) => {
    if (type.isUndefined(menu.id)) {
      throw new Error(`Menu id missing.`);
    }
    if (!type.isString(menu.id)) {
      throw new Error(`Menu id is not a string. Received ${JSON.stringify(menu.id)}.`);
    }
    checkDuplicateMenuId({ id: menu.id });
    menu.menuId = menu.id;
    menu.id = `menu:${menu.id}`;
    const checkDuplicateMenuItemId = createCheckDuplicateId({
      message: 'Duplicate menuItemId "{{ id }}" on menu "{{ menuId }}".',
    });
    loopItems({
      parent: menu,
      menuId: menu.menuId,
      pages,
      missingPageWarnings,
      checkDuplicateMenuItemId,
    });
  });
  missingPageWarnings.map(async (warning) => {
    context.logger.warn(
      `Page "${warning.pageId}" referenced in menu link "${warning.menuItemId}" not found.`
    );
  });
  return components;
}

export default buildMenu;
