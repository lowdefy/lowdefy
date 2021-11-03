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

import { get } from '@lowdefy/helpers';

class ComponentController {
  constructor({ getController, getLoader }) {
    this.authorizationController = getController('authorization');
    this.componentLoader = getLoader('component');
  }

  async getLowdefyGlobal() {
    const loadedLowdefyGlobal = await this.componentLoader.load('global');
    const lowdefyGlobal = loadedLowdefyGlobal || {};
    return lowdefyGlobal;
  }

  async getMenus() {
    const loadedMenus = await this.componentLoader.load('menus');
    const initPageId = await this.getInitPageId();
    const menus = this.filterMenus({ menus: loadedMenus || [], initPageId });
    const homePageId = await this.getHomePageId({ menus });
    return {
      menus,
      homePageId,
      initPageId,
    };
  }

  filterMenus({ menus, initPageId }) {
    return menus.map((menu) => {
      return {
        ...menu,
        links: this.filterMenuList({ menuList: get(menu, 'links', { default: [] }), initPageId }),
      };
    });
  }

  filterMenuList({ menuList, initPageId }) {
    return menuList
      .map((item) => {
        if (item.type === 'MenuLink') {
          if (item.pageId === initPageId) {
            return null;
          }
          if (this.authorizationController.authorize(item)) {
            return item;
          }
          return null;
        }
        if (item.type === 'MenuGroup') {
          const filteredSubItems = this.filterMenuList({
            menuList: get(item, 'links', { default: [] }),
          });
          if (filteredSubItems.length > 0) {
            return {
              ...item,
              links: filteredSubItems,
            };
          }
        }
        return null;
      })
      .filter((item) => item !== null);
  }

  async getInitPageId() {
    const configData = await this.componentLoader.load('config');
    if (configData && get(configData, 'initPageId')) {
      return get(configData, 'initPageId');
    } else {
      return null;
    }
  }

  async getHomePageId({ menus }) {
    const configData = await this.componentLoader.load('config');
    if (configData && get(configData, 'homePageId')) {
      return get(configData, 'homePageId');
    }
    let defaultMenu = menus.find((menu) => menu.menuId === 'default');
    if (!defaultMenu) {
      // eslint-disable-next-line prefer-destructuring
      defaultMenu = menus[0];
    }
    let homePageId = null;
    homePageId = get(defaultMenu, 'links.0.pageId', { default: null });
    if (!homePageId) {
      homePageId = get(defaultMenu, 'links.0.links.0.pageId', { default: null });
    }
    if (!homePageId) {
      homePageId = get(defaultMenu, 'links.0.links.0.links.0.pageId', { default: null });
    }
    return homePageId;
  }
}

function createComponentController(context) {
  return new ComponentController(context);
}

export { ComponentController };

export default createComponentController;
