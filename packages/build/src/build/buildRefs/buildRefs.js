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

import operators from '@lowdefy/operators-js/operators/build';

import { resolve, WalkContext } from './walker.js';
import getRefContent from './getRefContent.js';
import makeRefDefinition from './makeRefDefinition.js';
import collectDynamicIdentifiers from '../collectDynamicIdentifiers.js';
import validateOperatorsDynamic from '../validateOperatorsDynamic.js';
import isPageContentPath from '../jit/isPageContentPath.js';

// Validate and collect dynamic identifiers once at module load
validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

async function buildRefs({ context, shallowOptions }) {
  context.unresolvedRefVars = context.unresolvedRefVars ?? {};
  const refDef = makeRefDefinition('lowdefy.yaml', null, context.refMap);
  // Stash for Phase 3.5 (precomputeRuntimeOperators) so it can resolve error
  // source file paths without creating a new makeId entry.
  context.rootRefDef = refDef;

  const ctx = new WalkContext({
    buildContext: context,
    refId: refDef.id,
    sourceRefId: null,
    vars: {},
    path: '',
    currentFile: refDef.path,
    refChain: new Set(refDef.path ? [refDef.path] : []),
    operators,
    env: process.env,
    lowdefyApp: context.appMeta,
    authConfig: context.authConfigProjection,
    dynamicIdentifiers,
    shouldStop: (path, refId) => {
      // Module entry vars/connections were already resolved by parseLowdefyYaml
      // (same predicate) and live on context.modules — preserve the raw blobs so
      // the app pass doesn't pull and walk their refs a second time. buildModules
      // reads entry ids only and deletes components.modules before testSchema.
      if (/^modules\.\d+\.vars$/.test(path)) return 'preserve';
      if (/^modules\.\d+\.connections$/.test(path)) return 'preserve';
      if (shallowOptions) {
        // Strip page content (blocks, events, etc.) from ref-backed pages so
        // JIT can re-resolve them from source files. Inline pages (defined
        // directly in lowdefy.yaml) live in the root ref and have no separate
        // source file — their content must be preserved for buildShallowPages.
        return isPageContentPath(path) && refId !== refDef.id;
      }
      return null;
    },
  });

  const content = await getRefContent({
    context,
    refDef,
    referencedFrom: null,
  });

  const components = await resolve(content, ctx);
  return components ?? {};
}

export default buildRefs;
