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

import { EVENTS_ARTIFACT, PAGE_ARTIFACT } from '../artifactPatterns.js';
import buildAnchor from '../buildAnchor.js';
import describeEvent from '../describeEvent.js';
import removeFromParent from '../removeFromParent.js';

function enumerate({ node, parent, keyInParent, scope }) {
  if (scope.role !== 'action') {
    return [];
  }
  return [
    {
      key: node['~k'],
      arg: null,
      anchor: buildAnchor({ scope, type: 'action' }),
      describe: `drop-action ${node.type} "${node.id}" (${keyInParent + 1} of ${
        parent.length
      }) from ${describeEvent(scope)}`,
    },
  ];
}

function apply({ parent, keyInParent }) {
  return removeFromParent({ parent, keyInParent });
}

export default {
  name: 'drop-action',
  artifacts: [PAGE_ARTIFACT, EVENTS_ARTIFACT],
  enumerate,
  apply,
};
