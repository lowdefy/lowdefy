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

import path from 'node:path';

import { serializer, type } from '@lowdefy/helpers';

import getMobileAuth from './buildMobile/getMobileAuth.js';
import getMobileFeatureConfig from './buildMobile/getMobileFeatureConfig.js';
import getMobileHomePageId from './buildMobile/getMobileHomePageId.js';
import getMobileNotifications from './buildMobile/getMobileNotifications.js';
import loadIconData from './icons/loadIconData.js';

// The search tab draws the search icon unless it names its own.
function getItemIcon(item) {
  if (type.isString(item.icon)) {
    return item.icon;
  }
  return item.role === 'search' ? 'search' : undefined;
}

function getMenuItems(menus) {
  return [...(menus.tabs ?? []), ...(menus.drawer ?? [])];
}

function buildMenuItems({ items, iconData }) {
  return items.map((item) => {
    const icon = getItemIcon(item);
    return {
      pageId: item.pageId,
      title: item.title,
      icon,
      iconData: type.isString(icon) ? iconData[icon] : undefined,
      sfSymbol: item.sfSymbol,
      role: item.role,
    };
  });
}

async function buildMenus({ menus, context }) {
  if (type.isNone(menus) || menus.stack === true) {
    return { stack: true };
  }
  const iconNames = new Set(
    getMenuItems(menus)
      .map(getItemIcon)
      .filter((icon) => type.isString(icon))
  );
  const iconData = await loadIconData({ names: [...iconNames], icons: context.icons });
  if (type.isArray(menus.tabs)) {
    return { tabs: buildMenuItems({ items: menus.tabs, iconData }) };
  }
  return { drawer: buildMenuItems({ items: menus.drawer, iconData }) };
}

// lowdefy mobile reads each shell from here, so the icon is written as an
// absolute path and distribution with its default.
function buildShells({ shells, context }) {
  return (shells ?? []).map((shell) => ({
    id: shell.id,
    name: shell.name,
    icon: type.isString(shell.icon)
      ? path.resolve(context.directories.config, shell.icon)
      : undefined,
    color: shell.color,
    profile: shell.profile,
    version: shell.version,
    scheme: shell.scheme,
    distribution: shell.distribution ?? 'private',
    eas: type.isObject(shell.eas)
      ? { owner: shell.eas.owner, projectId: shell.eas.projectId }
      : undefined,
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
    // The opt-in native extensions lowdefy mobile config writes into shell.json.
    extensions: type.isArray(shell.extensions) ? shell.extensions : undefined,
    // lowdefy mobile config installs these into the shell project.
    plugins: type.isArray(shell.plugins)
      ? shell.plugins.map((plugin) => ({
          name: plugin.name,
          version: plugin.version,
          typePrefix: plugin.typePrefix,
          options: plugin.options,
        }))
      : undefined,
  }));
}

async function buildMobileConfig({ components, context }) {
  const { mobile } = components;
  return {
    homePageId: getMobileHomePageId({ components, mobilePageIndex: context.mobilePageIndex }),
    minShellVersion: mobile.minShellVersion ?? null,
    menus: await buildMenus({ menus: mobile.menus, context }),
    shells: buildShells({ shells: mobile.shells, context }),
    auth: getMobileAuth({ mobile }),
    notifications: getMobileNotifications({ mobile }),
    ...getMobileFeatureConfig({ mobile }),
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
// mobile/events.json: mobile.events, the app events a shell runs in place of
// the web app's events ({} when it has none), serialized like events.json so
// their ~k markers reach the shell's error locations.
// mobile/appJs.json: { jsEntries }, the client _js of mobile.events as module
// text (buildMobileAppJs), or null.
async function writeMobile({ components, context }) {
  const hasMobile = !type.isNone(components.mobile);
  const config = hasMobile ? await buildMobileConfig({ components, context }) : {};
  await context.writeBuildArtifact('mobile/config.json', JSON.stringify(config));
  await context.writeBuildArtifact(
    'mobile/events.json',
    serializer.serializeToString(components.mobile?.events ?? {})
  );
  await context.writeBuildArtifact(
    'mobile/pageIndex.json',
    JSON.stringify(context.mobilePageIndex)
  );
  await context.writeBuildArtifact('mobile/typeSets.json', JSON.stringify(context.mobileTypeSets));
  await context.writeBuildArtifact('mobile/theme.json', JSON.stringify(context.mobileTheme));
  await context.writeBuildArtifact('mobile/classMap.json', JSON.stringify(context.mobileClassMap));
  await context.writeBuildArtifact(
    'mobile/appJs.json',
    JSON.stringify({ jsEntries: context.mobileAppJsEntries })
  );
}

export default writeMobile;
