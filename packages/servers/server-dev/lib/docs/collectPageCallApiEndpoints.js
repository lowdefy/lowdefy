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

function getBlockId(node) {
  if (type.isString(node.blockId)) {
    return node.blockId;
  }
  if (type.isString(node.id)) {
    return node.id;
  }
  return null;
}

// An action list nests through control steps (:if/:then/:else, :switch/:case),
// so the whole event object is scanned rather than only its top-level try and
// catch arrays. A CallAPI whose endpointId is operator-valued names no
// endpoint at build and is reported as dynamic rather than guessed at.
function scanActions({ node, onCall, onDynamic }) {
  if (type.isArray(node)) {
    node.forEach((item) => scanActions({ node: item, onCall, onDynamic }));
    return;
  }
  if (!type.isObject(node)) {
    return;
  }
  if (node.type === 'CallAPI') {
    if (type.isString(node.params?.endpointId)) {
      onCall(node.params.endpointId);
    } else {
      onDynamic(type.isString(node.id) ? node.id : 'CallAPI');
    }
    return;
  }
  Object.keys(node).forEach((key) => {
    if (key.startsWith('~')) {
      return;
    }
    scanActions({ node: node[key], onCall, onDynamic });
  });
}

function walkBlocks({ node, calls, dynamic }) {
  if (type.isArray(node)) {
    node.forEach((item) => walkBlocks({ node: item, calls, dynamic }));
    return;
  }
  if (!type.isObject(node)) {
    return;
  }
  const blockId = getBlockId(node);
  if (type.isObject(node.events)) {
    Object.keys(node.events).forEach((event) => {
      if (event.startsWith('~')) {
        return;
      }
      scanActions({
        node: node.events[event],
        onCall: (endpointId) => calls.push({ endpointId, blockId, event }),
        onDynamic: (actionId) => dynamic.push({ actionId, blockId, event }),
      });
    });
  }
  Object.keys(node).forEach((key) => {
    if (key.startsWith('~') || key === 'events') {
      return;
    }
    walkBlocks({ node: node[key], calls, dynamic });
  });
}

// The static page → Api endpoint edges, read from the same CallAPI action
// params the build validates against the endpoint ids
// (packages/build/src/build/buildPages/buildBlock/validateCallApiRefs.js).
function collectPageCallApiEndpoints({ page }) {
  const calls = [];
  const dynamic = [];
  walkBlocks({ node: page, calls, dynamic });
  return { calls, dynamic };
}

export default collectPageCallApiEndpoints;
