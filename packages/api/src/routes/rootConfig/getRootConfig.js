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

import getAppEvents from './getAppEvents.js';
import getHomeAndMenus from './getHomeAndMenus.js';
import getLowdefyGlobal from './getLowdefyGlobal.js';
import getLowdefyI18n from './getLowdefyI18n.js';
import getLowdefyTheme from './getLowdefyTheme.js';
import getPagePaths from './getPagePaths.js';

async function getRootConfig(context) {
  const [events, lowdefyGlobal, theme, i18n, { home, menus }, pagePaths] = await Promise.all([
    getAppEvents(context),
    getLowdefyGlobal(context),
    getLowdefyTheme(context),
    getLowdefyI18n(context),
    getHomeAndMenus(context),
    getPagePaths(context),
  ]);
  return {
    events,
    home,
    i18n,
    lowdefyApp: context.appMeta,
    lowdefyGlobal,
    menus,
    pagePaths,
    theme,
  };
}

export default getRootConfig;
