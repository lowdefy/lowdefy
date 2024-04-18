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
import { get } from '@lowdefy/helpers';

import getMenus from './menus/getMenus.js';

async function getHomeAndMenus(context) {
  const menus = await getMenus(context);

  const homePageId = get(context.config, 'homePageId');
  if (homePageId) {
    return {
      home: {
        configured: true,
        pageId: homePageId,
      },
      menus,
    };
  }

  let defaultMenu = menus.find((menu) => menu.menuId === 'default');
  if (!defaultMenu) {
    // eslint-disable-next-line prefer-destructuring
    defaultMenu = menus[0];
  }
  let pageId = null;
  pageId = get(defaultMenu, 'links.0.pageId', { default: null });
  if (!pageId) {
    pageId = get(defaultMenu, 'links.0.links.0.pageId', { default: null });
  }
  if (!pageId) {
    pageId = get(defaultMenu, 'links.0.links.0.links.0.pageId', { default: null });
  }
  return {
    home: {
      configured: false,
      pageId,
    },
    menus,
  };
}

export default getHomeAndMenus;
