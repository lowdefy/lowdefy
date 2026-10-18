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

import getMobileAuth from './buildMobile/getMobileAuth.js';
import getMobileHomePageId from './buildMobile/getMobileHomePageId.js';
import loadIconData from './icons/loadIconData.js';

function getMenuItems(menus) {
  return [...(menus.tabs ?? []), ...(menus.drawer ?? [])];
}

function buildMenuItems({ items, iconData }) {
  return items.map((item) => ({
    pageId: item.pageId,
    title: item.title,
    icon: item.icon,
    iconData: type.isString(item.icon) ? iconData[item.icon] : undefined,
  }));
}

async function buildMenus({ menus, context }) {
  if (type.isNone(menus) || menus.stack === true) {
    return { stack: true };
  }
  const iconNames = new Set(
    getMenuItems(menus)
      .map((item) => item.icon)
      .filter((icon) => type.isString(icon))
  );
  const iconData = await loadIconData({ names: [...iconNames], icons: context.icons });
  if (type.isArray(menus.tabs)) {
    return { tabs: buildMenuItems({ items: menus.tabs, iconData }) };
  }
  return { drawer: buildMenuItems({ items: menus.drawer, iconData }) };
}

function buildShells(shells) {
  return (shells ?? []).map((shell) => ({
    id: shell.id,
    scheme: shell.scheme,
    ios: type.isObject(shell.ios)
      ? { bundleId: shell.ios.bundleId, teamId: shell.ios.teamId }
      : undefined,
    android: type.isObject(shell.android)
      ? {
          package: shell.android.package,
          sha256: type.isString(shell.android.sha256)
            ? [shell.android.sha256]
            : shell.android.sha256,
        }
      : undefined,
  }));
}

async function buildMobileConfig({ components, context }) {
  const { mobile } = components;
  return {
    homePageId: getMobileHomePageId({ components, mobilePageIndex: context.mobilePageIndex }),
    minShellVersion: mobile.minShellVersion ?? null,
    menus: await buildMenus({ menus: mobile.menus, context }),
    shells: buildShells(mobile.shells),
    auth: getMobileAuth({ mobile }),
  };
}

// What a shell needs from the build. Written for every app, as {} and [] when
// the app has no mobile key, so the server reads them without existence checks.
//
// mobile/theme.json: { darkMode, light, dark }, darkMode as theme.darkMode
// ("system", "light" or "dark") and light and dark the computed antd tokens of
// each mode (colorPrimary, borderRadius, fontSize, ...).
// mobile/classMap.json: { [className]: reactNativeStyle }, every Tailwind
// class on mobile pages that has a native form. Variants are keyed by the full
// class ("dark:bg-gray-900", "sm:flex-row"); in dark mode a shell reads
// "dark:<class>" before "<class>", which the build adds for classes that use
// an antd theme colour.
async function writeMobile({ components, context }) {
  const config = type.isNone(components.mobile)
    ? {}
    : await buildMobileConfig({ components, context });
  await context.writeBuildArtifact('mobile/config.json', JSON.stringify(config));
  await context.writeBuildArtifact(
    'mobile/pageIndex.json',
    JSON.stringify(context.mobilePageIndex)
  );
  await context.writeBuildArtifact('mobile/typeSets.json', JSON.stringify(context.mobileTypeSets));
  await context.writeBuildArtifact('mobile/theme.json', JSON.stringify(context.mobileTheme));
  await context.writeBuildArtifact('mobile/classMap.json', JSON.stringify(context.mobileClassMap));
}

export default writeMobile;
