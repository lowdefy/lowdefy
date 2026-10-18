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

import alwaysBundledIcons from '../icons/alwaysBundledIcons.js';
import collectIconNames from '../buildImports/collectIconNames.js';
import resolveIconName from '../icons/resolveIconName.js';

// buildJs replaced each _js body in page config with its hash, so a page
// reaches a function's icon names through the hash (as createGetPageIcons).
function getPageJsSources({ pageText, jsMap }) {
  return Object.values(jsMap).flatMap((sources) =>
    Object.entries(sources)
      .filter(([hash]) => pageText.includes(JSON.stringify(hash)))
      .map(([, source]) => source)
  );
}

// The icon names a shell draws on one mobile or shared page, found as the
// web's page icons are: the icons the native client draws itself, the names
// in the page's config, its _js sources and global, and the icons its native
// block types list in meta.icons. Only names that resolve, since the page
// carries their icon data; the Icon renderer draws icon-missing for any other
// name. Runs after buildPage, which counted the page's block types. Sorted.
function collectMobilePageIconNames({ context, global, icons, page }) {
  const names = new Set(alwaysBundledIcons);
  function addIfResolves(name) {
    if (resolveIconName({ name, ...icons }) !== null) {
      names.add(name);
    }
  }
  const pageText = JSON.stringify(page);
  const texts = [
    pageText,
    JSON.stringify(global),
    ...getPageJsSources({ pageText, jsMap: context.jsMap }),
  ];
  texts.forEach((text) => {
    collectIconNames({ text }).forEach(addIfResolves);
  });
  const blockTypes = Object.keys(context.pageTypeCounters.get(page.pageId).blocks.getCounts());
  blockTypes.forEach((blockType) => {
    (context.typesMapMobile.icons[blockType] ?? []).forEach(addIfResolves);
  });
  return [...names].sort();
}

export default collectMobilePageIconNames;
