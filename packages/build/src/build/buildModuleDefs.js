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

import { resolve, WalkContext } from './buildRefs/walker.js';
import getRefContent from './buildRefs/getRefContent.js';
import makeRefDefinition from './buildRefs/makeRefDefinition.js';
import evaluateStaticOperators from './buildRefs/evaluateStaticOperators.js';
import collectDynamicIdentifiers from './collectDynamicIdentifiers.js';
import validateOperatorsDynamic from './validateOperatorsDynamic.js';
import fetchModules from './fetchModules.js';
import registerModuleEntry from './registerModules.js';

validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

async function parseLowdefyYaml({ context }) {
  const refDef = makeRefDefinition('lowdefy.yaml', null, context.refMap);

  const content = await getRefContent({
    context,
    refDef,
    referencedFrom: null,
  });

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
  });

  let config = await resolve(content, ctx);

  config = evaluateStaticOperators({ context, input: config, refDef });

  return config ?? {};
}

async function buildModuleDefs({ context }) {
  const lowdefyConfig = await parseLowdefyYaml({ context });
  const moduleEntries = lowdefyConfig.modules ?? [];

  if (moduleEntries.length === 0) {
    return;
  }

  const resolvedPaths = await fetchModules({ moduleEntries, context });

  for (const entry of moduleEntries) {
    await registerModuleEntry({
      entry,
      resolvedPaths: resolvedPaths[entry.id],
      context,
    });
  }
}

export default buildModuleDefs;
