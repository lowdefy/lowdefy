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

function buildDefaultMobileMenu({ pages, context }) {
  context.logger.warn('No mobile menus found. Building default mobile menu.');
  return [
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
}

function buildMobileMenu({ components, context }) {
  const mobile = components.mobile ?? {};
  const pages = type.isArray(mobile.pages) ? mobile.pages : [];
  // Menu links are validated against mobile pages only — a link to a web
  // pageId is removed with a warning, like any missing page.
  if ((type.isUndefined(mobile.menus) || mobile.menus.length === 0) && pages.length > 0) {
    mobile.menus = buildDefaultMobileMenu({ pages, context });
  }
  buildMenuSet({ menus: mobile.menus ?? [], pages, context });
  return components;
}

export default buildMobileMenu;
