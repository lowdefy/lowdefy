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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';
import { findDataOrigin, getPossibleOperators } from '@lowdefy/operators';

function joinPath(path, key) {
  return `${path}.${key}`;
}

// An object the client would run as an operator must have been written as one.
// The per-result scan refuses operators in data as it is returned; data merged
// with config afterwards (_object.assign, a key set to undefined) can still end
// up with an operator key alone, so the finished content is checked here.
function findDataOperator({ blocks, literalData }) {
  const pending = [{ node: blocks, path: 'blocks' }];
  while (pending.length > 0) {
    const { node, path } = pending.pop();
    if (type.isObject(node)) {
      const [possible] = getPossibleOperators({
        value: node,
        operators: literalData.clientOperators,
      });
      const origin = possible ? findDataOrigin({ literalData, value: node }) : null;
      if (origin !== null) {
        return { operator: possible.operator, origin, path };
      }
    }
    if (type.isObject(node) || type.isArray(node)) {
      const keys = Object.keys(node);
      for (let index = keys.length - 1; index >= 0; index -= 1) {
        pending.push({ node: node[keys[index]], path: joinPath(path, keys[index]) });
      }
    }
  }
  return null;
}

// The items a block, an event map, an action list or an action holds, in the
// order they are checked: a block's events, skeleton (rendered through
// LoadingBlock, like content) and child block lists; control branches (:if,
// :switch) of an action list. A :return item holds no action.
function getStructureChildren({ kind, node, path }) {
  if (kind === 'block') {
    const children = [
      { kind: 'events', node: node.events, path: `${path}.events` },
      { kind: 'block', node: node.skeleton, path: `${path}.skeleton` },
    ];
    if (type.isArray(node.blocks)) {
      children.push({ kind: 'blocks', node: node.blocks, path: `${path}.blocks` });
    }
    ['areas', 'slots'].forEach((containerKey) => {
      if (!type.isObject(node[containerKey])) return;
      Object.keys(node[containerKey]).forEach((name) => {
        children.push({
          kind: 'blocks',
          node: node[containerKey][name]?.blocks,
          path: `${path}.${containerKey}.${name}.blocks`,
        });
      });
    });
    return children;
  }
  if (kind === 'events') {
    return Object.keys(node).flatMap((eventName) => {
      const event = node[eventName];
      const eventPath = joinPath(path, eventName);
      if (type.isArray(event)) {
        return [{ kind: 'actions', node: event, path: eventPath }];
      }
      return [
        { kind: 'actions', node: event?.try, path: `${eventPath}.try` },
        { kind: 'actions', node: event?.catch, path: `${eventPath}.catch` },
      ];
    });
  }
  if (kind === 'blocks' || kind === 'actions') {
    const itemKind = kind === 'blocks' ? 'block' : 'action';
    return node.map((item, index) => ({ kind: itemKind, node: item, path: joinPath(path, index) }));
  }
  if (':if' in node) {
    return [
      { kind: 'actions', node: node[':then'], path: `${path}.:then` },
      { kind: 'actions', node: node[':else'], path: `${path}.:else` },
    ];
  }
  if (':switch' in node) {
    const cases = type.isArray(node[':switch']) ? node[':switch'] : [];
    return [
      ...cases.map((caseObject, caseIndex) => ({
        kind: 'actions',
        node: caseObject?.[':then'],
        path: `${path}.:switch.${caseIndex}.:then`,
      })),
      { kind: 'actions', node: node[':default'], path: `${path}.:default` },
    ];
  }
  return [];
}

function isStructureNode({ kind, node }) {
  if (kind === 'blocks' || kind === 'actions') {
    return type.isArray(node);
  }
  return type.isObject(node);
}

// The first block or action in the content that is data, walked with an
// explicit stack.
function findDataStructure({ blocks, literalData }) {
  const pending = [{ kind: 'blocks', node: blocks, path: 'blocks' }];
  while (pending.length > 0) {
    const item = pending.pop();
    if (isStructureNode(item)) {
      const isAction =
        item.kind === 'action' &&
        !(':if' in item.node) &&
        !(':switch' in item.node) &&
        !(':return' in item.node);
      if (item.kind === 'block' || isAction) {
        const origin = findDataOrigin({ literalData, value: item.node });
        if (origin !== null) {
          return { what: item.kind === 'block' ? 'Block' : 'Action', path: item.path, origin };
        }
      }
      const children = getStructureChildren(item);
      for (let index = children.length - 1; index >= 0; index -= 1) {
        pending.push(children[index]);
      }
    }
  }
  return null;
}

// Checks the content a Dynamic block's endpoint returns, as :return built it.
// Data may fill values inside the blocks the :return writes, but without a
// dynamic blocks policy it may not be a block or an action itself: a block or
// action that is data an operator returned, or a copy a copying read made of
// it, is refused. Config is never matched by content. With a policy the policy
// checks every block and action at page get instead. Under both, data may not
// become an operator.
function checkLiteralContent({ blocks, configKey, literalData }) {
  if (!type.isArray(blocks)) {
    return;
  }
  if (type.isNone(literalData.policyId)) {
    const structure = findDataStructure({ blocks, literalData });
    if (structure) {
      throw new ConfigError(
        `${structure.what} at "${structure.path}" is data returned by "${structure.origin}". A Dynamic block without a dynamic blocks policy renders only blocks and actions written in its endpoint's :return config. Map data into blocks inside :return, or check stored blocks with a ValidateDynamic step under a policy.`,
        { configKey }
      );
    }
  }
  const operator = findDataOperator({ blocks, literalData });
  if (operator) {
    throw new ConfigError(
      `Data returned by "${operator.origin}" can run as the operator "${operator.operator}" at "${operator.path}" once it is merged with other config. Operators in endpoint data do not run in Dynamic block content.`,
      { configKey }
    );
  }
}

export default checkLiteralContent;
