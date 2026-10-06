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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';
import collectExceptions from '../utils/collectExceptions.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';
import findMissingPathParams from './buildRoutes/findMissingPathParams.js';
import routeHasPlaceholders from './buildRoutes/routeHasPlaceholders.js';

// A page with placeholders in its path has no values to link to from a menu
// built for it, so the default menu leaves it out.
function buildDefaultMenu({ components, context }) {
  context.logger.warn('No menus found. Building default menu.');
  const patternedPageIds = new Set(
    context.routes.filter((route) => routeHasPlaceholders({ route })).map((route) => route.pageId)
  );
  const pages = (type.isArray(components.pages) ? components.pages : []).filter(
    (page) => !patternedPageIds.has(page.pageId)
  );
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

function validateMenuItem(menuItem, menuId, context) {
  const configKey = menuItem?.['~k'];
  if (!type.isObject(menuItem)) {
    collectExceptions(
      context,
      new ConfigError(`Menu item should be an object on menu "${menuId}".`, {
        received: menuItem,
        configKey,
      })
    );
    return false;
  }
  if (type.isUndefined(menuItem.id)) {
    collectExceptions(
      context,
      new ConfigError(`Menu item id missing on menu "${menuId}".`, { configKey })
    );
    return false;
  }
  if (!type.isString(menuItem.id)) {
    collectExceptions(
      context,
      new ConfigError(`Menu item id is not a string on menu "${menuId}".`, {
        received: menuItem.id,
        configKey,
      })
    );
    return false;
  }
  if (type.isNone(menuItem.type)) {
    collectExceptions(
      context,
      new ConfigError(`Menu item type is not defined at "${menuItem.id}" on menu "${menuId}".`, {
        configKey,
      })
    );
    return false;
  }
  if (!type.isString(menuItem.type)) {
    collectExceptions(
      context,
      new ConfigError(`Menu item type is not a string at "${menuItem.id}" on menu "${menuId}".`, {
        received: menuItem.type,
        configKey,
      })
    );
    return false;
  }
  return true;
}

// A menu link to a page with placeholders gives every placeholder a static
// value, so the menu and a home page chosen from it have a URL to link to.
function checkMenuLinkPathParams({ menuItem, menuId, context }) {
  const route = context.routes.find((candidate) => candidate.pageId === menuItem.pageId);
  if (type.isUndefined(route) || !routeHasPlaceholders({ route })) {
    return;
  }
  const missing = findMissingPathParams({ route, pathParams: menuItem.pathParams });
  if (missing.length === 0) {
    return;
  }
  const { id, pageId } = menuItem;
  const names = missing.map((name) => `"${name}"`).join(', ');
  collectExceptions(
    context,
    new ConfigError(
      `Menu link "${id}" on menu "${menuId}" links to page "${pageId}" without path params ${names}. Page "${pageId}" has path "${route.path}", so the menu link's pathParams must give every placeholder a value.`,
      { configKey: menuItem['~k'] }
    )
  );
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
      if (!validateMenuItem(menuItem, menuId, context)) {
        menuItem.remove = true;
        return;
      }
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
            checkMenuLinkPathParams({ menuItem, menuId, context });
          }
        } else {
          menuItem.auth = { public: true };
        }
      }
      if (menuItem.type === 'MenuGroup') {
        menuItem.auth = { public: true };
      }
      if (menuItem.type === 'MenuDivider') {
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
  });
  // Track which menus failed validation so we skip processing them
  const failedMenuIndices = new Set();

  components.menus.forEach((menu, menuIndex) => {
    const configKey = menu['~k'];
    if (type.isUndefined(menu.id)) {
      collectExceptions(context, new ConfigError('Menu id missing.', { configKey }));
      failedMenuIndices.add(menuIndex);
      return;
    }
    if (!type.isString(menu.id)) {
      collectExceptions(
        context,
        new ConfigError('Menu id is not a string.', { received: menu.id, configKey })
      );
      failedMenuIndices.add(menuIndex);
      return;
    }
    checkDuplicateMenuId({ id: menu.id, configKey });
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
      context,
    });
  });
  missingPageWarnings.forEach((warning) => {
    context.handleWarning(
      new ConfigWarning(
        `Page "${warning.pageId}" referenced in menu link "${warning.menuItemId}" not found.`,
        { configKey: warning.configKey, prodError: true, checkSlug: 'link-refs' }
      )
    );
  });
  return components;
}

export default buildMenu;
