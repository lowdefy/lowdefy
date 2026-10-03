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

import { EVENTS_ARTIFACT, PAGE_ARTIFACT } from '../artifactPatterns.js';
import buildAnchor from '../buildAnchor.js';
import describeEvent from '../describeEvent.js';

// The build's default pages always include 404, so a retargeted Link always
// lands somewhere. Links by url, back or home name no page and are skipped.
function linksToPage(params) {
  if (type.isString(params)) {
    return true;
  }
  return (
    type.isObject(params) &&
    !type.isUndefined(params.pageId) &&
    type.isUndefined(params.url) &&
    type.isUndefined(params.back) &&
    type.isUndefined(params.home)
  );
}

function enumerate({ node, scope }) {
  if (scope.role !== 'action' || node.type !== 'Link') {
    return [];
  }
  if (!linksToPage(node.params)) {
    return [];
  }
  return [
    {
      key: node['~k'],
      arg: null,
      anchor: buildAnchor({ scope, type: 'action' }),
      describe: `retarget-link Link "${node.id}" from ${describeEvent(scope)} to 404`,
    },
  ];
}

function apply({ node }) {
  if (type.isString(node.params)) {
    node.params = '404';
    return { applied: true };
  }
  if (linksToPage(node.params)) {
    node.params.pageId = '404';
    return { applied: true };
  }
  return { applied: false, reason: 'Link names no page' };
}

export default {
  name: 'retarget-link',
  artifacts: [PAGE_ARTIFACT, EVENTS_ARTIFACT],
  enumerate,
  apply,
};
