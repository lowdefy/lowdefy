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

import collectExceptions from '../../utils/collectExceptions.js';

function getMenuItems(menus) {
  return [...(menus?.tabs ?? []), ...(menus?.drawer ?? [])];
}

// The home page, every menu item and the share page must open a page a shell
// can show: a mobile page, or a page shared by web and mobile.
function validateMobilePageRefs({ components, context }) {
  const { mobile } = components;
  const mobilePageIds = new Set(
    components.pages
      .filter((page) => page.target === 'mobile' || page.target === 'both')
      .map((page) => page.id)
  );
  getMenuItems(mobile.menus).forEach((item) => {
    if (!mobilePageIds.has(item.pageId)) {
      collectExceptions(
        context,
        new ConfigError(
          `Mobile menu item links to page "${item.pageId}", which is not a mobile page. List it in "mobile.pages".`,
          { configKey: item['~k'] }
        )
      );
    }
  });
  if (!type.isUndefined(mobile.homePageId) && !mobilePageIds.has(mobile.homePageId)) {
    collectExceptions(
      context,
      new ConfigError(
        `App "mobile.homePageId" is "${mobile.homePageId}", which is not a mobile page. List it in "mobile.pages".`,
        { configKey: mobile['~k'] }
      )
    );
  }
  if (!type.isUndefined(mobile.share) && !mobilePageIds.has(mobile.share.pageId)) {
    collectExceptions(
      context,
      new ConfigError(
        `App "mobile.share.pageId" is "${mobile.share.pageId}", which is not a mobile page. List it in "mobile.pages".`,
        { configKey: mobile.share['~k'] ?? mobile['~k'] }
      )
    );
  }
}

export default validateMobilePageRefs;
