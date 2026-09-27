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

import collectIconNames from '../buildImports/collectIconNames.js';
import alwaysBundledIcons from '../icons/alwaysBundledIcons.js';

// A page's icons are the app's icons (components.imports.icons, which only
// holds names that resolve) that the page itself can reach: the names its own
// config and _js sources hold, its blocks' meta.icons, the icons the client
// draws itself, and the names in menus and global, which every page renders
// or reads. The same whole-string scan as the app-wide set, so a page set is
// the app set restricted to the page. Names that only arrive at runtime
// (theme.icons.include, endpoints, server routines, other pages) stay in the
// app-wide icons chunk the client loads when one is missing.
function createGetPageIcons({ components, context }) {
  const appIcons = new Set(components.imports.icons);

  function collectAppIcons({ text }) {
    return [...collectIconNames({ text })].filter((name) => appIcons.has(name));
  }

  const sharedIcons = [
    ...alwaysBundledIcons,
    ...collectAppIcons({ text: JSON.stringify(components.menus ?? []) }),
    ...collectAppIcons({ text: JSON.stringify(components.global ?? {}) }),
  ];

  // buildJs replaced each _js body in page config with its hash, so a page
  // reaches a function's names through the hash. Most functions name no icon.
  const jsIcons = [];
  Object.values(context.jsMap).forEach((sources) => {
    Object.entries(sources).forEach(([hash, source]) => {
      const names = collectAppIcons({ text: source });
      if (names.length > 0) {
        jsIcons.push({ quotedHash: JSON.stringify(hash), names });
      }
    });
  });

  function getPageIcons({ blocks, page }) {
    const text = JSON.stringify(page);
    const names = new Set([...sharedIcons, ...collectAppIcons({ text })]);
    jsIcons.forEach(({ quotedHash, names: jsNames }) => {
      if (text.includes(quotedHash)) {
        jsNames.forEach((name) => names.add(name));
      }
    });
    blocks.forEach((blockType) => {
      (context.typesMap.icons[blockType] ?? [])
        .filter((name) => appIcons.has(name))
        .forEach((name) => names.add(name));
    });
    return [...names].sort();
  }

  return getPageIcons;
}

export default createGetPageIcons;
