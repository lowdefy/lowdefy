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

import { rememberPath } from '@lowdefy/engine';

import setLowdefyUser from './setLowdefyUser.js';

// Points the lowdefy object at the page being shown and the caller it renders.
// Runs on every render, so it sees the person signed in on load and any later
// change. matchedPath and pathParams are the server's match of the shown page:
// the path it was matched on (no basePath, no leading "/") and the values it
// carries.
function updateLowdefyPage({ config, lowdefy, matchedPath, pathParams, user }) {
  lowdefy.home = config.rootConfig.home || {};
  lowdefy.linkPaths = config.pageConfig.linkPaths;
  lowdefy.menus = config.rootConfig.menus;
  lowdefy.pageId = config.pageConfig.pageId;
  lowdefy.pagePaths = config.rootConfig.pagePaths;
  setLowdefyUser({ lowdefy, user });
  lowdefy._internal.storage.clearUserStorageOnOwnerChange();

  // The shown page's path joins the path memory before its context is built,
  // so the first load's page is known before any plugin reads the memory.
  rememberPath({
    lowdefy,
    path: matchedPath,
    pageId: config.pageConfig.pageId,
    pathParams,
    pattern: config.pageConfig.path,
  });
  return lowdefy;
}

export default updateLowdefyPage;
