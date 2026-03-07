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
import evaluateStaticOperators from './evaluateStaticOperators.js';
import collectDynamicIdentifiers from '../collectDynamicIdentifiers.js';
import validateOperatorsDynamic from '../validateOperatorsDynamic.js';
import isPageContentPath from '../jit/isPageContentPath.js';

// Validate and collect dynamic identifiers once at module load
validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

async function buildRefs({ context, shallowOptions }) {
  context.unresolvedRefVars = context.unresolvedRefVars ?? {};
  const refDef = makeRefDefinition('lowdefy.yaml', null, context.refMap);

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
    dynamicIdentifiers,
    shouldStop: shallowOptions ? (path) => isPageContentPath(path) : null,
  });

  const content = await getRefContent({
    context,
    refDef,
    referencedFrom: null,
  });

  let components = await resolve(content, ctx);

  // Evaluate static operators (_sum, _if, etc.) that don't depend on runtime data
  components = evaluateStaticOperators({
    context,
    input: components,
    refDef,
  });
  return components ?? {};
}

export default buildRefs;
