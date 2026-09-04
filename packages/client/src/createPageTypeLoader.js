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

// Loads a page's type-import module before the page renders and merges its
// exports into the registries the renderer reads. The registries are mutated
// in place: initLowdefyContext captures them once, and every lookup is by type
// name at render time, so a later merge is visible without a re-init.
//
// The app-wide barrels are the fallback, imported once and only when needed —
// a page with no module of its own (the dev server's JIT pages, an unbuilt
// page) or a type the page module does not carry (a Dynamic block resolved at
// page-get time).
function createPageTypeLoader({ loadFullTypes, pageTypeModules, types }) {
  let fullTypesPromise = null;

  function mergeTypes(module) {
    Object.assign(types.actions, module.actions);
    Object.assign(types.blocks, module.blocks);
    Object.assign(types.operators, module.operators);
  }

  function loadAllTypes() {
    if (type.isNone(fullTypesPromise)) {
      fullTypesPromise = loadFullTypes().then(mergeTypes);
    }
    return fullTypesPromise;
  }

  return async function loadPageTypes({ pageConfig, pageId }) {
    const loadPageModule = pageTypeModules[pageId];
    if (type.isNone(loadPageModule)) {
      await loadAllTypes();
      return;
    }
    try {
      mergeTypes(await loadPageModule());
    } catch (error) {
      // A page chunk that will not load (a redeploy under an open tab) is a
      // fetch failure, not a config fault — the barrels still render the page.
      await loadAllTypes();
      return;
    }
    if (type.isNone(pageConfig)) {
      return;
    }
    const missing = findMissingTypes({ pageConfig, types });
    if (missing.length === 0) {
      return;
    }
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info(
        `Page "${pageId}" uses types its type-import module does not carry: ${missing.join(
          ', '
        )}. Loading the full type barrels.`
      );
    }
    await loadAllTypes();
  };
}

export default createPageTypeLoader;
