/*
  Copyright 2020-2024 Lowdefy, Inc

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

import extractOperatorKey from '../../utils/extractOperatorKey.js';
import traverseConfig from '../../utils/traverseConfig.js';

function validateStateReferences({ page, context }) {
  // Single traversal collects blockIds, _state references, and SetState keys
  // More memory-efficient than stringify+regex for massive pages
  const blockIds = new Set();
  const setStateKeys = new Set();
  const stateRefs = new Map(); // topLevelKey -> configKey (first occurrence)

  // Collect ~k values inside request.properties subtrees so we can skip them
  // when collecting _state refs — those are already handled by validateServerStateReferences
  const requestPropertyKeys = new Set();
  (page.requests ?? []).forEach((request) => {
    if (request.properties) {
      traverseConfig({
        config: request.properties,
        visitor: (obj) => {
          if (obj['~k']) requestPropertyKeys.add(obj['~k']);
        },
      });
    }
  });

  traverseConfig({
    config: page,
    visitor: (obj) => {
      // Collect blockId if present, including the top-level key for dot-notation ids
      if (type.isString(obj.blockId)) {
        blockIds.add(obj.blockId);
        const topLevel = obj.blockId.split(/[.\[]/)[0];
        if (topLevel !== obj.blockId) {
          blockIds.add(topLevel);
        }
      }

      // Collect SetState action params to track state keys being initialized
      if (obj.type === 'SetState' && obj.params) {
        Object.keys(obj.params).forEach((key) => {
          const topLevelKey = key.split(/[.\[]/)[0];
          setStateKeys.add(topLevelKey);
        });
      }

      // Collect _state reference if present (skip request.properties — handled separately)
      if (obj._state !== undefined && !requestPropertyKeys.has(obj['~k'])) {
        const topLevelKey = extractOperatorKey({ operatorValue: obj._state });
        if (topLevelKey && !stateRefs.has(topLevelKey)) {
          stateRefs.set(topLevelKey, obj['~k']);
        }
      }
    },
  });

  // Filter to only undefined references and warn
  stateRefs.forEach((configKey, topLevelKey) => {
    // Skip if state key is from an input block or SetState action
    if (blockIds.has(topLevelKey) || setStateKeys.has(topLevelKey)) return;

    const message =
      `_state references "${topLevelKey}" on page "${page.pageId}", ` +
      `but no input block with id "${topLevelKey}" exists on this page. ` +
      `State keys are created from input block ids. ` +
      `Check for typos, add an input block with this id, or initialize the state with SetState.`;

    context.logger.warn({ message, configKey, prodError: true, checkSlug: 'state-refs' });
  });
}

export default validateStateReferences;
