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

// The payload a page artifact's request carries is what the browser
// evaluates and sends, so dropping one key changes what the server receives.
function enumerate({ node, scope }) {
  if (scope.role !== 'payload') {
    return [];
  }
  return Object.keys(node).map((arg) => ({
    key: node['~k'],
    arg,
    anchor: buildAnchor({ scope, type: 'request' }),
    describe: `drop-payload "${arg}" from request "${scope.requestId}"`,
  }));
}

function apply({ node, arg }) {
  if (!type.isString(arg)) {
    return { applied: false, reason: 'drop-payload needs the payload key as arg' };
  }
  if (!Object.prototype.hasOwnProperty.call(node, arg)) {
    return { applied: false, reason: `payload has no key "${arg}"` };
  }
  delete node[arg];
  return { applied: true };
}

export default {
  name: 'drop-payload',
  artifacts: [PAGE_ARTIFACT],
  enumerate,
  apply,
};
