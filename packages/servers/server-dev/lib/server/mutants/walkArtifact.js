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

import getArtifactKind from './getArtifactKind.js';

function isRoutineStep(node) {
  return type.isObject(node) && type.isString(node.id) && type.isString(node.type);
}

function rootScope({ artifact, root }) {
  const kind = getArtifactKind(artifact);
  switch (kind) {
    case 'page':
      return {
        kind,
        pageId: root.pageId,
        role: 'block',
        region: 'block',
        blockId: root.blockId ?? root.pageId,
        blockType: root.type,
        parentBlockId: null,
      };
    case 'app':
      return { kind, pageId: 'app', role: 'events', region: 'events', blockId: null };
    case 'request':
      return { kind, pageId: root.pageId, requestId: root.requestId, role: 'requestRoot' };
    case 'endpoint':
      return { kind, endpointId: root.endpointId, role: 'endpointRoot' };
    default:
      return null;
  }
}

function blockChildScope({ scope, key }) {
  switch (key) {
    case 'slots':
      return { ...scope, role: 'slots', region: 'slots' };
    case 'events':
      return { ...scope, role: 'events', region: 'events' };
    case 'properties':
      return { ...scope, role: 'value', region: 'blockProperties' };
    case 'validate':
      return { ...scope, role: 'validate', region: 'validate' };
    case 'requests':
      // Only the page itself holds requests; the server never runs this copy
      // of their config (it reads the request artifact), so only the payload
      // the browser evaluates is walked.
      return scope.parentBlockId === null
        ? { ...scope, role: 'requests', region: 'requests' }
        : null;
    default:
      return { ...scope, role: 'value', region: 'blockOther' };
  }
}

// The scope of `child`, found at `key` in `node` (scope `scope`), or null to
// leave the subtree out. A scope names the node's role in the artifact
// (block, action, payload, step, ...) and where it sits (page, block,
// event), which is what operators enumerate by and anchors are built from.
function childScope({ scope, key, child }) {
  switch (scope.role) {
    case 'block':
      return blockChildScope({ scope, key });
    case 'slots':
      return { ...scope, role: 'slot' };
    case 'slot':
      return key === 'blocks' ? { ...scope, role: 'slotBlocks' } : null;
    case 'slotBlocks':
      return {
        ...scope,
        role: 'block',
        region: 'block',
        parentBlockId: scope.blockId,
        blockId: child?.blockId,
        blockType: child?.type,
      };
    case 'events':
      return { ...scope, role: 'event', eventName: key };
    case 'event':
      return key === 'try' || key === 'catch' ? { ...scope, role: 'actions', branch: key } : null;
    case 'actions':
      return { ...scope, role: 'action', actionId: child?.id, actionType: child?.type };
    case 'action':
      return {
        ...scope,
        role: 'value',
        region: key === 'params' ? 'actionParams' : 'actionOther',
      };
    case 'validate':
      return { ...scope, role: 'validateEntry' };
    case 'requests':
      return { ...scope, role: 'request', requestId: child?.requestId };
    case 'request':
      return key === 'payload' ? { ...scope, role: 'payload', region: 'requestPayload' } : null;
    case 'requestRoot':
      return key === 'properties' ? { ...scope, role: 'value', region: 'requestProperties' } : null;
    case 'endpointRoot':
      return key === 'routine' ? { ...scope, role: 'routine', region: 'routine' } : null;
    case 'routine':
      // An array of routine items: steps, controls, or nested arrays.
      if (isRoutineStep(child)) {
        return { ...scope, role: 'step', stepId: child.stepId ?? child.id, stepType: child.type };
      }
      if (type.isArray(child)) {
        return { ...scope, role: 'routine' };
      }
      if (type.isObject(child) && Object.keys(child).some((childKey) => childKey.startsWith(':'))) {
        return { ...scope, role: 'control' };
      }
      return { ...scope, role: 'routineValue' };
    case 'control':
      // `:then`, `:else`, `:try`, `:parallel`, ... hold more steps; `:if`,
      // `:set_state`, `:return`, ... hold values.
      return { ...scope, role: type.isArray(child) ? 'routine' : 'routineValue' };
    case 'step':
    case 'routineValue':
      return { ...scope, role: 'routineValue' };
    default:
      return { ...scope, role: 'value' };
  }
}

// Depth-first walk of one deserialised build artifact, calling visit for every
// object with its parent, its key in the parent and its scope.
function walkArtifact({ artifact, root, visit }) {
  function walk({ node, parent, keyInParent, scope }) {
    if (type.isArray(node)) {
      node.forEach((child, index) => {
        const next = childScope({ scope, key: index, child });
        if (next !== null) walk({ node: child, parent: node, keyInParent: index, scope: next });
      });
      return;
    }
    if (!type.isObject(node)) {
      return;
    }
    visit({ node, parent, keyInParent, artifact, scope });
    Object.keys(node).forEach((key) => {
      const next = childScope({ scope, key, child: node[key] });
      if (next !== null) walk({ node: node[key], parent: node, keyInParent: key, scope: next });
    });
  }
  const scope = rootScope({ artifact, root });
  if (scope === null) {
    return;
  }
  walk({ node: root, parent: null, keyInParent: null, scope });
}

export default walkArtifact;
