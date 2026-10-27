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

import filterMobileMenus from './filterMobileMenus.js';
import getLowdefyGlobal from '../rootConfig/getLowdefyGlobal.js';
import getLowdefyI18n from '../rootConfig/getLowdefyI18n.js';
import getMobileAppEvents from './getMobileAppEvents.js';
import getOpenablePageIds from './getOpenablePageIds.js';

function getShellAuth({ auth, config }) {
  if (type.isNone(auth)) {
    return null;
  }
  const { emailCode, unlock, unlockAfter, sharedDevice } = config.auth;
  return { emailCode, unlock, unlockAfter, sharedDevice };
}

// What a shell syncs on start: the mobile frame, the index of the pages this
// caller may open with each page's hash and typesKey, the type set of each of
// those keys, minShellVersion, the theme ({ darkMode, light, dark }, antd's
// computed tokens per mode) and the Tailwind class map. Menu icons carry their
// node data.
//
// The app's identity (lowdefyApp, with the buildId a shell stamps its page
// requests with), its global and its i18n are what a shell's engine starts
// from, as the web root config gives them. Its app events are mobile.events,
// not the web app's events, which may use web-only actions. Their _js comes as
// _jsEntries, module text a shell evaluates, as a mobile page's does.
//
// The dev build writes the page index without hashes or typesKeys, and no type
// sets: the dev server builds pages on demand. Its class map holds the classes
// of the pages the skeleton build compiles; a page built on request carries
// its own classes' entries.
//
// auth is the mobile.auth a shell signs in and locks by (emailCode, unlock,
// unlockAfter, sharedDevice), or null for an app without auth, which a shell
// opens with no sign-in screen. sessionExpiresIn is the server's alone.
//
// notifications, share, widgets, shortcuts and background drive the shell's
// native features: push registration endpoints and notification categories,
// the share page, widget sources, icon quick actions and background fetch.
//
// Returns null for an app without a mobile key: no shell opens it.
async function getMobileRootConfig(context) {
  const [
    config,
    pageIndex,
    typeSets,
    theme,
    classMap,
    appJs,
    openablePageIds,
    events,
    lowdefyGlobal,
    i18n,
  ] = await Promise.all([
    context.readConfigFile('mobile/config.json'),
    context.readConfigFile('mobile/pageIndex.json'),
    context.readConfigFile('mobile/typeSets.json'),
    context.readConfigFile('mobile/theme.json'),
    context.readConfigFile('mobile/classMap.json'),
    context.readConfigFile('mobile/appJs.json'),
    getOpenablePageIds(context),
    getMobileAppEvents(context),
    getLowdefyGlobal(context),
    getLowdefyI18n(context),
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
    _jsEntries: appJs.jsEntries,
    auth: getShellAuth({ auth: context.auth, config }),
    events,
    homePageId: config.homePageId,
    i18n,
    lowdefyApp: context.appMeta,
    lowdefyGlobal,
    minShellVersion: config.minShellVersion,
    menus: filterMobileMenus({ menus: config.menus, openablePageIds }),
    pageIndex: openablePageIndex,
    typeSets: openableTypeSets,
    theme,
    classMap,
    notifications: config.notifications,
    share: config.share,
    widgets: config.widgets,
    shortcuts: config.shortcuts,
    background: config.background,
  };
}

export default getMobileRootConfig;
