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

// The chunks a page's first render waits for: its types key's chunk and
// imports, plus every icon when Dynamic content needs icons outside the
// page's set (loadPageTypes loads them before rendering).
function getPageAssets({ assets, pageConfig }) {
  const pageAssets = assets.pageTypes[pageConfig.typesKey];
  if (pageConfig.loadAllTypes !== true && pageConfig.loadAllIcons !== true) {
    return pageAssets;
  }
  return {
    ...pageAssets,
    js: [...new Set([...pageAssets.js, ...assets.icons.js])],
    css: [...new Set([...pageAssets.css, ...assets.icons.css])],
  };
}

export default getPageAssets;
