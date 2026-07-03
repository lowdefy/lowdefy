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
import { ConfigError } from '@lowdefy/errors';

import buildBlock from '../build/buildPages/buildBlock/buildBlock.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';
import createCounter from '../utils/createCounter.js';

// At build time, type counters feed types.json and import generation. At
// runtime the client bundle is fixed, so the same counter calls become
// membership checks against the bundled types instead.
function createMembershipCounter({ category, allowed, dynamicBlockId, pageId }) {
  return {
    increment: (typeName) => {
      if (!allowed.has(typeName)) {
        throw new ConfigError(
          `Dynamic block "${dynamicBlockId}" on page "${pageId}" resolved content uses ${category} type "${typeName}" which is not included in the app's client bundle. Declare it in the Dynamic block's properties.types.`
        );
      }
    },
  };
}

// types.json is fileCache-cached (same object per server lifetime), so the
// allowed-type sets are derived once per types object, not per Dynamic block.
const allowedSetsCache = new WeakMap();

function getAllowedSets(types) {
  let sets = allowedSetsCache.get(types);
  if (!sets) {
    sets = {
      actions: new Set(Object.keys(types.actions ?? {})),
      blocks: new Set(Object.keys(types.blocks ?? {})),
      operators: new Set(Object.keys(types.operators?.client ?? {})),
    };
    allowedSetsCache.set(types, sets);
  }
  return sets;
}

// Counter for categories dynamic content cannot reach (requests are forbidden,
// so request types and server operators never occur in a valid fragment).
const noopCounter = { increment: () => {} };

function buildDynamicBlocks({ blocks, pageId, dynamicBlockId, idPrefix, types, blockMetas }) {
  if (!type.isArray(blocks)) {
    throw new ConfigError(
      `Dynamic block "${dynamicBlockId}" on page "${pageId}" endpoint must return an object with a "blocks" array.`,
      { received: blocks }
    );
  }
  const warnings = [];
  const callApiActionRefs = [];
  const requestActionRefs = [];
  const allowed = getAllowedSets(types);
  const pageContext = {
    blockIdCounter: createCounter(),
    // Namespace runtime ids under the resolving Dynamic block's built id —
    // unique by construction, so they can never collide with static block ids.
    blockIdPrefix: idPrefix,
    callApiActionRefs,
    checkDuplicateRequestId: createCheckDuplicateId({
      message: 'Duplicate requestId "{{ id }}" on page "{{ pageId }}".',
    }),
    context: {
      blockMetas,
      handleWarning: (warning) => {
        warnings.push(warning);
      },
    },
    // Pure sink — buildDynamicBlock pushes nested Dynamic refs here, but at
    // runtime a bad endpointId surfaces through resolution, not ref checking.
    dynamicBlockRefs: [],
    forbidRequests: true,
    linkActionRefs: [],
    pageId,
    requestActionRefs,
    requests: [],
    shortcutRefs: [],
    typeCounters: {
      actions: createMembershipCounter({
        category: 'action',
        allowed: allowed.actions,
        dynamicBlockId,
        pageId,
      }),
      blocks: createMembershipCounter({
        category: 'block',
        allowed: allowed.blocks,
        dynamicBlockId,
        pageId,
      }),
      operators: {
        client: createMembershipCounter({
          category: 'operator',
          allowed: allowed.operators,
          dynamicBlockId,
          pageId,
        }),
        server: noopCounter,
      },
      requests: noopCounter,
    },
    websocketActionRefs: [],
  };
  blocks.forEach((block) => buildBlock(block, pageContext));
  return { blocks, callApiActionRefs, requestActionRefs, warnings };
}

export default buildDynamicBlocks;
