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

import pageTypes, { allTypes, icons } from '../build/plugins/pageTypes.js';

import types from './types.js';

// Loads the plugin code one page uses: its type set (a chunk shared by every
// page with the same set), the app-wide icons, and the full type set when
// Dynamic content reaches outside the page's own types.
async function loadPageTypes({ pageConfig }) {
  const loaders = [
    pageTypes[pageConfig.typesKey]().then((module) => module.default),
    icons().then((module) => ({ icons: module.default })),
  ];
  if (pageConfig.loadAllTypes === true) {
    loaders.push(allTypes());
  }
  const loaded = await Promise.all(loaders);
  loaded.forEach((typeSet) => {
    Object.entries(typeSet).forEach(([category, entries]) => {
      Object.assign(types[category], entries);
    });
  });
}

export default loadPageTypes;
