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

import findMissingTypes from './findMissingTypes.js';

// react-icons names are string values in a page config, never a type key, so
// they are found the way the build finds them — by react-icons name prefix.
// A match is only a candidate: it counts as a missing icon when the app-wide
// barrel has the name, which is what appIconNames lists.
const iconNameRegex =
  /"((?:Ai|Bi|Bs|Cg|Ci|Di|Fa|Fc|Fi|Gi|Go|Gr|Hi|Im|Io|Lu|Md|Pi|Ri|Rx|Si|Sl|Tb|Tfi|Ti|Vsc|Wi)[A-Z0-9]\w*)"/g;

function findMissingIcons({ appIconNames, pageConfig, types }) {
  const missing = new Set();
  [...JSON.stringify(pageConfig).matchAll(iconNameRegex)].forEach(([, name]) => {
    if (appIconNames.has(name) && type.isNone(types.icons[name])) {
      missing.add(name);
    }
  });
  return [...missing];
}

// Loads a page's type-import module before the page renders and merges its
// exports (block components, client actions, client operators and icons) into
// the registries the renderer reads. The registries are mutated
// in place: initLowdefyContext captures them once, and every lookup is by type
// name at render time, so a later merge is visible without a re-init.
//
// The app-wide barrels are the fallback, imported once and only when needed —
// a page with no module of its own (the dev server's JIT pages, an unbuilt
// page) or a type the page module does not carry (a Dynamic block resolved at
// page-get time).
function createPageTypeLoader({ iconNames, loadFullIcons, loadFullTypes, pageTypeModules, types }) {
  const appIconNames = new Set(iconNames);
  let fullTypesPromise = null;
  let fullIconsPromise = null;

  function mergeTypes(module) {
    Object.assign(types.actions, module.actions);
    Object.assign(types.blocks, module.blocks);
    Object.assign(types.icons, module.icons);
    Object.assign(types.operators, module.operators);
  }

  function loadAllTypes() {
    if (type.isNone(fullTypesPromise)) {
      fullTypesPromise = loadFullTypes().then(mergeTypes);
    }
    return fullTypesPromise;
  }

  // The icon barrel is its own chunk: a page that carries every type it needs
  // but one icon a Dynamic block introduced pays for the icons only.
  function loadAllIcons() {
    if (type.isNone(fullIconsPromise)) {
      fullIconsPromise = loadFullIcons().then((icons) => Object.assign(types.icons, icons));
    }
    return fullIconsPromise;
  }

  function logFallback({ missing, pageId, what }) {
    if (process.env.NODE_ENV === 'production') return;
    // eslint-disable-next-line no-console
    console.info(
      `Page "${pageId}" uses ${what} its type-import module does not carry: ${missing.join(
        ', '
      )}. Loading the full ${what} barrel.`
    );
  }

  return async function loadPageTypes({ pageConfig, pageId }) {
    const loadPageModule = pageTypeModules[pageId];
    if (type.isNone(loadPageModule)) {
      await Promise.all([loadAllTypes(), loadAllIcons()]);
      return;
    }
    try {
      mergeTypes(await loadPageModule());
    } catch (error) {
      // A page chunk that will not load (a redeploy under an open tab) is a
      // fetch failure, not a config fault — the barrels still render the page.
      await Promise.all([loadAllTypes(), loadAllIcons()]);
      return;
    }
    if (type.isNone(pageConfig)) {
      return;
    }
    const fallbacks = [];
    const missingTypes = findMissingTypes({ pageConfig, types });
    if (missingTypes.length > 0) {
      logFallback({ missing: missingTypes, pageId, what: 'types' });
      fallbacks.push(loadAllTypes());
    }
    const missingIcons = findMissingIcons({ appIconNames, pageConfig, types });
    if (missingIcons.length > 0) {
      logFallback({ missing: missingIcons, pageId, what: 'icons' });
      fallbacks.push(loadAllIcons());
    }
    await Promise.all(fallbacks);
  };
}

export default createPageTypeLoader;
