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
import buildMenuSet from './buildMenuSet.js';

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

function buildMenu({ components, context }) {
  const pages = type.isArray(components.pages) ? components.pages : [];
  if (type.isUndefined(components.menus) || components.menus.length === 0) {
    components.menus = buildDefaultMenu({ components, context });
  }
  buildMenuSet({ menus: components.menus, pages, context });
  return components;
}

export default buildMenu;
