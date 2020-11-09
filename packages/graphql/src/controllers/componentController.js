/*
  Copyright 2020 Lowdefy, Inc

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
  constructor({ getLoader, DEPLOYMENT_ID, DEPLOYMENT_NAME, DOMAIN_NAME }) {
    this.componentLoader = getLoader('component');
    this.DEPLOYMENT_ID = DEPLOYMENT_ID;
    this.DEPLOYMENT_NAME = DEPLOYMENT_NAME;
    this.DOMAIN_NAME = DOMAIN_NAME;
  }

  async getLowdefyGlobal() {
    const loadedLowdefyGlobal = await this.componentLoader.load('global');
    const lowdefyGlobal = loadedLowdefyGlobal || {};
    lowdefyGlobal.deploymentId = this.DEPLOYMENT_ID;
    lowdefyGlobal.deploymentName = this.DEPLOYMENT_NAME;
    lowdefyGlobal.domainName = this.DOMAIN_NAME;
    return lowdefyGlobal;
  }

  async getMenus() {
    const loadedMenus = await this.componentLoader.load('menus');
    const menus = loadedMenus || [];
    const homePageId = await this.getHomePageId({ menus });
    return {
      menus,
      homePageId,
    };
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
