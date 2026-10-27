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

import { createLowdefyCore, updateLowdefyPage } from '@lowdefy/client-core';

import createIcon from './icon/createIcon.js';
import createStreamFetch from './block/createStreamFetch.js';
import createImageSource from './link/createImageSource.js';
import createLinkComponent from './link/createLinkComponent.js';
import createResolveUrl from './link/createResolveUrl.js';
import getBlockMetas from './getBlockMetas.js';
import getMatchedPath from './getMatchedPath.js';
import Screen from './screen/Screen.js';
import setupLink from './link/setupLink.js';

// Builds the app-level lowdefy object on the core the first time a page renders, then points it
// at the page being shown. The renderer's own page type, Screen, joins the block map; a block set
// that brings its own Screen wins. The native icon renderer is installed as components.Icon over
// `types.icons`, the live map of icon data by name, as the web client does. pathname is the
// shown screen's path, which the path memory records the page under.
function initNativeLowdefy({ core, host, pageConfig, pathname, pathParams, rootConfig, types }) {
  const { apiBase, auth, basePath = '', lowdefy } = core;
  if (!lowdefy._internal?.initialised) {
    const blocks = { Screen, ...types.blocks };
    createLowdefyCore({
      apiBase,
      auth,
      basePath,
      host,
      lowdefy,
      rootConfig,
      types: { ...types, blockMetas: getBlockMetas(blocks), blocks },
    });
    lowdefy._internal.link = setupLink(lowdefy);
    lowdefy._internal.components.Icon = createIcon({
      icons: types.icons ?? {},
      iconTheme: rootConfig.theme?.icons,
    });
    lowdefy._internal.components.Link = createLinkComponent(lowdefy);
    lowdefy._internal.components.handleError = lowdefy._internal.handleError;
    lowdefy._internal.components.resolveUrl = createResolveUrl(lowdefy);
    lowdefy._internal.components.imageSource = createImageSource(lowdefy);
    lowdefy._internal.streamFetch = createStreamFetch({ lowdefy });
    // The classes a development build has warned are missing from the class map, once each.
    lowdefy._internal.missingClasses = new Set();
  }
  updateLowdefyPage({
    config: { pageConfig, rootConfig },
    lowdefy,
    matchedPath: getMatchedPath({ basePath, pathname }),
    pathParams,
    user: auth?.user,
  });
  return lowdefy;
}

export default initNativeLowdefy;
