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

import { get, set, type } from '@lowdefy/helpers';

import { PAGE_ARTIFACT } from '../artifactPatterns.js';
import buildAnchor from '../buildAnchor.js';

const ARGS = ['visible', 'properties.disabled'];

function enumerate({ node, scope }) {
  if (scope.role !== 'block') {
    return [];
  }
  return ARGS.filter((arg) => !type.isUndefined(get(node, arg))).map((arg) => ({
    key: node['~k'],
    arg,
    anchor: buildAnchor({ scope, type: 'block' }),
    describe: `flip-visible ${arg} on ${scope.blockId}`,
  }));
}

function apply({ node, arg }) {
  if (!ARGS.includes(arg)) {
    return { applied: false, reason: `flip-visible needs arg visible or properties.disabled` };
  }
  const value = get(node, arg);
  if (type.isUndefined(value)) {
    return { applied: false, reason: `block has no ${arg}` };
  }
  set(node, arg, type.isBoolean(value) ? !value : { _not: value });
  return { applied: true };
}

export default {
  name: 'flip-visible',
  artifacts: [PAGE_ARTIFACT],
  enumerate,
  apply,
};
