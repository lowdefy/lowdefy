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

import {
  ENDPOINT_ARTIFACT,
  EVENTS_ARTIFACT,
  PAGE_ARTIFACT,
  REQUEST_ARTIFACT,
} from '../artifactPatterns.js';
import buildAnchor from '../buildAnchor.js';

const REGIONS = [
  'blockProperties',
  'actionParams',
  'requestPayload',
  'requestProperties',
  'routine',
];

function anchorType(scope) {
  switch (scope.region) {
    case 'blockProperties':
      return 'block';
    case 'actionParams':
      return 'action';
    case 'routine':
      return 'endpoint';
    default:
      return 'request';
  }
}

function describeWhere(scope) {
  switch (scope.region) {
    case 'blockProperties':
      return `${scope.blockId}.properties`;
    case 'actionParams':
      return `action "${scope.actionId}" params`;
    case 'routine':
      return `endpoint "${scope.endpointId}"`;
    case 'requestPayload':
      return `request "${scope.requestId}" payload`;
    default:
      return `request "${scope.requestId}" properties`;
  }
}

function isSwappableIf(node) {
  return type.isObject(node._if) && !type.isUndefined(node._if.else);
}

function isSwappableRoutineIf(node, scope) {
  return (
    scope.role === 'control' && !type.isUndefined(node[':if']) && !type.isUndefined(node[':else'])
  );
}

function enumerate({ node, scope }) {
  if (!REGIONS.includes(scope.region)) {
    return [];
  }
  if (!isSwappableIf(node) && !isSwappableRoutineIf(node, scope)) {
    return [];
  }
  const operator = isSwappableIf(node) ? '_if' : ':if';
  return [
    {
      key: node['~k'],
      arg: null,
      anchor: buildAnchor({ scope, type: anchorType(scope) }),
      describe: `swap-if ${operator} in ${describeWhere(scope)}`,
    },
  ];
}

function apply({ node }) {
  if (isSwappableIf(node)) {
    const { then, else: otherwise } = node._if;
    node._if.then = otherwise;
    node._if.else = then;
    return { applied: true };
  }
  if (!type.isUndefined(node[':if']) && !type.isUndefined(node[':else'])) {
    const then = node[':then'];
    node[':then'] = node[':else'];
    node[':else'] = then;
    return { applied: true };
  }
  return { applied: false, reason: 'no _if or :if with an else branch' };
}

export default {
  name: 'swap-if',
  artifacts: [PAGE_ARTIFACT, REQUEST_ARTIFACT, ENDPOINT_ARTIFACT, EVENTS_ARTIFACT],
  enumerate,
  apply,
};
