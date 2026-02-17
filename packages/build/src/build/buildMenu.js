/* eslint-disable no-param-reassign */

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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';
import collectExceptions from '../utils/collectExceptions.js';
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

function loopItems({
  parent,
  menuId,
  pages,
  missingPageWarnings,
  checkDuplicateMenuItemId,
  context,
}) {
  if (type.isArray(parent.links)) {
    parent.links.forEach((menuItem) => {
      const configKey = menuItem['~k'];
      if (menuItem.type === 'MenuLink') {
        if (type.isString(menuItem.pageId)) {
          const page = pages.find((pg) => pg.pageId === menuItem.pageId);
          if (!page) {
            missingPageWarnings.push({
              menuItemId: menuItem.id,
              pageId: menuItem.pageId,
              configKey,
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
      checkDuplicateMenuItemId({ id: menuItem.id, menuId, configKey });
      menuItem.menuItemId = menuItem.id;
      menuItem.id = `menuitem:${menuId}:${menuItem.id}`;
      loopItems({
        parent: menuItem,
        menuId,
        pages,
        missingPageWarnings,
        checkDuplicateMenuItemId,
        context,
      });
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
  const checkDuplicateMenuId = createCheckDuplicateId({
    message: 'Duplicate menuId "{{ id }}".',
    context,
  });
  // Track which menus failed validation so we skip processing them
  const failedMenuIndices = new Set();

  components.menus.forEach((menu, menuIndex) => {
    const configKey = menu['~k'];
    if (type.isUndefined(menu.id)) {
      collectExceptions(
        context,
        new ConfigError({ message: 'Menu id missing.', configKey, context })
      );
      failedMenuIndices.add(menuIndex);
      return;
    }
    if (!type.isString(menu.id)) {
      collectExceptions(
        context,
        new ConfigError({
          message: `Menu id is not a string.`,
          received: menu.id,
          configKey,
          context,
        })
      );
      failedMenuIndices.add(menuIndex);
      return;
    }
    checkDuplicateMenuId({ id: menu.id, configKey });
    menu.menuId = menu.id;
    menu.id = `menu:${menu.id}`;
    const checkDuplicateMenuItemId = createCheckDuplicateId({
      message: 'Duplicate menuItemId "{{ id }}" on menu "{{ menuId }}".',
      context,
    });
    loopItems({
      parent: menu,
      menuId: menu.menuId,
      pages,
      missingPageWarnings,
      checkDuplicateMenuItemId,
      context,
    });
  });
  missingPageWarnings.forEach((warning) => {
    context.handleWarning({
      message: `Page "${warning.pageId}" referenced in menu link "${warning.menuItemId}" not found.`,
      configKey: warning.configKey,
      prodError: true,
      checkSlug: 'link-refs',
    });
  });
  return components;
}

export default buildMenu;
