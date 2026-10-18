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

import filterMobileMenus from './filterMobileMenus.js';
import getAppEvents from '../rootConfig/getAppEvents.js';
import getLowdefyGlobal from '../rootConfig/getLowdefyGlobal.js';
import getOpenablePageIds from './getOpenablePageIds.js';

// What a shell syncs on start: the mobile frame, the index of the pages this
// caller may open with each page's hash and typesKey, the type set of each of
// those keys, and minShellVersion. Menu icons carry their node data. The theme
// fields are placeholders until the native theme is defined.
//
// The app's identity (lowdefyApp, with the buildId a shell stamps its page
// requests with), its global and its app events are what a shell's engine
// starts from, as the web root config gives them.
//
// The dev build writes the page index without hashes or typesKeys, and no type
// sets: the dev server builds pages on demand.
//
// Returns null for an app without a mobile key: no shell opens it.
async function getMobileRootConfig(context) {
  const [config, pageIndex, typeSets, openablePageIds, events, lowdefyGlobal] = await Promise.all([
    context.readConfigFile('mobile/config.json'),
    context.readConfigFile('mobile/pageIndex.json'),
    context.readConfigFile('mobile/typeSets.json'),
    getOpenablePageIds(context),
    getAppEvents(context),
    getLowdefyGlobal(context),
  ]);
  if (Object.keys(config).length === 0) {
    return null;
  }
  const openablePageIndex = pageIndex.filter((entry) => openablePageIds.has(entry.pageId));
  const openableTypeSets = {};
  openablePageIndex.forEach((entry) => {
    if (typeSets[entry.typesKey]) {
      openableTypeSets[entry.typesKey] = typeSets[entry.typesKey];
    }
  });
  return {
    events,
    homePageId: config.homePageId,
    lowdefyApp: context.appMeta,
    lowdefyGlobal,
    minShellVersion: config.minShellVersion,
    menus: filterMobileMenus({ menus: config.menus, openablePageIds }),
    pageIndex: openablePageIndex,
    typeSets: openableTypeSets,
    theme: { light: {}, dark: {} },
  };
}

export default getMobileRootConfig;
