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

import { PAGE_ARTIFACT } from '../artifactPatterns.js';
import buildAnchor from '../buildAnchor.js';
import describeEvent from '../describeEvent.js';
import removeFromParent from '../removeFromParent.js';

// Page artifacts only: the build refuses Validate in app events.
function enumerate({ node, parent, keyInParent, scope }) {
  if (scope.role === 'action' && node.type === 'Validate') {
    return [
      {
        key: node['~k'],
        arg: null,
        anchor: buildAnchor({ scope, type: 'action' }),
        describe: `skip-validate Validate "${node.id}" from ${describeEvent(scope)}`,
      },
    ];
  }
  if (scope.role === 'block' && !type.isNone(node.required) && node.required !== false) {
    return [
      {
        key: node['~k'],
        arg: 'required',
        anchor: buildAnchor({ scope, type: 'block' }),
        describe: `skip-validate required on ${scope.blockId}`,
      },
    ];
  }
  if (scope.role === 'validateEntry') {
    return [
      {
        key: node['~k'],
        arg: null,
        anchor: buildAnchor({ scope, type: 'block' }),
        describe: `skip-validate validate rule ${keyInParent + 1} of ${parent.length} on ${
          scope.blockId
        }`,
      },
    ];
  }
  return [];
}

function apply({ node, parent, keyInParent, arg }) {
  if (arg === 'required') {
    if (type.isUndefined(node.required)) {
      return { applied: false, reason: 'block has no required' };
    }
    delete node.required;
    return { applied: true };
  }
  return removeFromParent({ parent, keyInParent });
}

export default {
  name: 'skip-validate',
  artifacts: [PAGE_ARTIFACT],
  enumerate,
  apply,
};
