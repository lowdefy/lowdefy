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

import { getOperatorType, type } from '@lowdefy/helpers';

import extractOperatorPath from '../../utils/extractOperatorPath.js';
import traverseConfig from '../../utils/traverseConfig.js';

export { default as resolveStatePath } from './resolveStatePath.js';

// One traversal of a built page collecting everything that reads or writes
// page state: block ids (with their type), SetState param keys and _state
// references. _state inside request.properties is left out — it is always {}
// at runtime and validateServerStateReferences reports it separately. Shared
// by validateStateReferences and validateStateSchema so both see the same
// usage.
function collectStateUsage({ page }) {
  const blockIds = [];
  const setStateKeys = [];
  const stateRefs = [];

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
      if (type.isString(obj.blockId)) {
        blockIds.push({ id: obj.blockId, type: obj.type, configKey: obj['~k'] });
      }

      // An operator-valued params object computes its keys at runtime.
      if (
        obj.type === 'SetState' &&
        type.isObject(obj.params) &&
        getOperatorType(obj.params) === null
      ) {
        Object.keys(obj.params).forEach((key) => {
          if (key.startsWith('~')) return;
          setStateKeys.push({ key, configKey: obj['~k'] });
        });
      }

      if (obj._state !== undefined && !requestPropertyKeys.has(obj['~k'])) {
        const path = extractOperatorPath({ operatorValue: obj._state });
        if (path !== null) {
          stateRefs.push({ path, configKey: obj['~k'] });
        }
      }
    },
  });

  return { blockIds, setStateKeys, stateRefs };
}

export default collectStateUsage;
