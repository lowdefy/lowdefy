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

import { get, type } from '@lowdefy/helpers';

import normaliseArtifact from './normaliseArtifact.js';

const MENU_LINK_PATHS = [
  'links.0.pageId',
  'links.0.links.0.pageId',
  'links.0.links.0.links.0.pageId',
];

// The page the app opens at /, as the server resolves it: config.homePageId,
// else the first link of the default menu (or the first menu), up to three
// groups deep.
function resolveHomePageId({ build }) {
  const config = normaliseArtifact(build.appWide['config.json']);
  if (type.isString(config.homePageId)) return config.homePageId;
  const menus = normaliseArtifact(build.appWide['menus.json']);
  const menu = menus.find((item) => item.menuId === 'default') ?? menus[0];
  if (type.isNone(menu)) return null;
  for (const linkPath of MENU_LINK_PATHS) {
    const pageId = get(menu, linkPath, { default: null });
    if (type.isString(pageId)) return pageId;
  }
  return null;
}

export default resolveHomePageId;
