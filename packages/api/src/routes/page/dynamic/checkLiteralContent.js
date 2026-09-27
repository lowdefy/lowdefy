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
function findDataOperator({ value, path, literalData }) {
  if (type.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findDataOperator({
        value: value[index],
        path: joinPath(path, index),
        literalData,
      });
      if (found) return found;
    }
    return null;
  }
  if (!type.isObject(value)) {
    return null;
  }
  const [possible] = getPossibleOperators({ value, operators: literalData.clientOperators });
  if (possible) {
    const origin = findDataOrigin({ literalData, value });
    if (origin !== null) {
      return { operator: possible.operator, origin, path };
    }
  }
  for (const key of Object.keys(value)) {
    const found = findDataOperator({ value: value[key], path: joinPath(path, key), literalData });
    if (found) return found;
  }
  return null;
}

function childBlockLists({ block, path }) {
  const lists = [];
  if (type.isArray(block.blocks)) {
    lists.push({ blocks: block.blocks, path: joinPath(path, 'blocks') });
  }
  ['areas', 'slots'].forEach((containerKey) => {
    if (!type.isObject(block[containerKey])) return;
    Object.keys(block[containerKey]).forEach((name) => {
      const list = block[containerKey][name]?.blocks;
      if (type.isArray(list)) {
        lists.push({ blocks: list, path: `${path}.${containerKey}.${name}.blocks` });
      }
    });
  });
  return lists;
}

// Control branches (:if, :switch) hold action lists of their own; a :return
// item holds no action.
function findDataInActionItem({ item, path, literalData }) {
  if (!type.isObject(item) || ':return' in item) {
    return null;
  }
  const branches = [];
  if (':if' in item) {
    branches.push([item[':then'], `${path}.:then`], [item[':else'], `${path}.:else`]);
  } else if (':switch' in item) {
    (type.isArray(item[':switch']) ? item[':switch'] : []).forEach((caseObject, caseIndex) => {
      branches.push([caseObject?.[':then'], `${path}.:switch.${caseIndex}.:then`]);
    });
    branches.push([item[':default'], `${path}.:default`]);
  } else {
    const origin = findDataOrigin({ literalData, value: item });
    return origin === null ? null : { what: 'Action', path, origin };
  }
  for (const [actions, branchPath] of branches) {
    // eslint-disable-next-line no-use-before-define
    const found = findDataAction({ actions, path: branchPath, literalData });
    if (found) return found;
  }
  return null;
}

function findDataAction({ actions, path, literalData }) {
  if (!type.isArray(actions)) {
    return null;
  }
  for (let index = 0; index < actions.length; index += 1) {
    const found = findDataInActionItem({
      item: actions[index],
      path: joinPath(path, index),
      literalData,
    });
    if (found) return found;
  }
  return null;
}

function findDataEvent({ events, path, literalData }) {
  if (!type.isObject(events)) {
    return null;
  }
  for (const eventName of Object.keys(events)) {
    const event = events[eventName];
    const eventPath = joinPath(path, eventName);
    const lists = type.isArray(event)
      ? [[event, eventPath]]
      : [
          [event?.try, `${eventPath}.try`],
          [event?.catch, `${eventPath}.catch`],
        ];
    for (const [actions, listPath] of lists) {
      const found = findDataAction({ actions, path: listPath, literalData });
      if (found) return found;
    }
  }
  return null;
}

function findDataBlock({ block, path, literalData }) {
  if (!type.isObject(block)) {
    return null;
  }
  const origin = findDataOrigin({ literalData, value: block });
  if (origin !== null) {
    return { what: 'Block', path, origin };
  }
  const found = findDataEvent({ events: block.events, path: `${path}.events`, literalData });
  if (found) {
    return found;
  }
  // Skeletons render through LoadingBlock, like content.
  const children = [{ block: block.skeleton, path: `${path}.skeleton` }];
  childBlockLists({ block, path }).forEach((list) => {
    list.blocks.forEach((child, index) =>
      children.push({ block: child, path: joinPath(list.path, index) })
    );
  });
  for (const child of children) {
    const childFound = findDataBlock({ block: child.block, path: child.path, literalData });
    if (childFound) return childFound;
  }
  return null;
}

// Checks the content a Dynamic block's endpoint returns, as :return built it.
// Data may fill values inside the blocks the :return writes, but without a
// dynamic blocks policy it may not be a block or an action itself: a block or
// action that is data an operator returned, or a copy of it, is refused. With a
// policy the policy checks every block and action at page get instead. Under
// both, data may not become an operator.
function checkLiteralContent({ blocks, configKey, literalData }) {
  if (!type.isArray(blocks)) {
    return;
  }
  if (type.isNone(literalData.policyId)) {
    const structure = blocks.reduce(
      (found, block, index) =>
        found ?? findDataBlock({ block, path: joinPath('blocks', index), literalData }),
      null
    );
    if (structure) {
      throw new ConfigError(
        `${structure.what} at "${structure.path}" is data returned by "${structure.origin}". A Dynamic block without a dynamic blocks policy renders only blocks and actions written in its endpoint's :return config. Map data into blocks inside :return, or check stored blocks with a ValidateDynamic step under a policy.`,
        { configKey }
      );
    }
  }
  const operator = findDataOperator({ value: blocks, path: 'blocks', literalData });
  if (operator) {
    throw new ConfigError(
      `Data returned by "${operator.origin}" can run as the operator "${operator.operator}" at "${operator.path}" once it is merged with other config. Operators in endpoint data do not run in Dynamic block content.`,
      { configKey }
    );
  }
}

export default checkLiteralContent;
