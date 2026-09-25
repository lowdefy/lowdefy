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

import { getOperatorType, type } from '@lowdefy/helpers';

import checkAction from './checkAction.js';
import checkValue from './checkValue.js';

function literalError({ path, what, policy }) {
  return {
    path,
    rule: 'policy.literal',
    message: `${what} must be literal under dynamic policy "${policy.id}", not an operator.`,
  };
}

// Walks an action list and the branches of its controls (:if/:then/:else,
// :switch/:case/:then/:default, :return), checking each action and returning
// the number of actions visited.
function checkActionList({ actions, path, walk }) {
  const { errors, policy } = walk;
  if (!type.isArray(actions)) {
    errors.push(literalError({ path, what: 'An action list', policy }));
    return 0;
  }
  let count = 0;
  actions.forEach((item, index) => {
    const itemPath = `${path}.${index}`;
    if (type.isObject(item) && ':if' in item) {
      checkValue({ value: item[':if'], path: `${itemPath}.:if`, policy, errors });
      count += checkActionList({ actions: item[':then'] ?? [], path: `${itemPath}.:then`, walk });
      count += checkActionList({ actions: item[':else'] ?? [], path: `${itemPath}.:else`, walk });
      return;
    }
    if (type.isObject(item) && ':switch' in item) {
      if (!type.isArray(item[':switch'])) {
        errors.push(literalError({ path: `${itemPath}.:switch`, what: 'A :switch', policy }));
        return;
      }
      item[':switch'].forEach((caseObject, caseIndex) => {
        const casePath = `${itemPath}.:switch.${caseIndex}`;
        checkValue({ value: caseObject?.[':case'], path: `${casePath}.:case`, policy, errors });
        count += checkActionList({
          actions: caseObject?.[':then'] ?? [],
          path: `${casePath}.:then`,
          walk,
        });
      });
      count += checkActionList({
        actions: item[':default'] ?? [],
        path: `${itemPath}.:default`,
        walk,
      });
      return;
    }
    if (type.isObject(item) && ':return' in item) {
      checkValue({ value: item[':return'], path: `${itemPath}.:return`, policy, errors });
      return;
    }
    count += 1;
    checkAction({ action: item, path: itemPath, walk });
  });
  return count;
}

// An event is an action list or { try, catch, debounce }.
function checkEvents({ events, path, walk }) {
  const { errors, policy } = walk;
  if (!type.isObject(events) || getOperatorType(events) !== null) {
    errors.push(literalError({ path, what: 'Block "events"', policy }));
    return;
  }
  Object.keys(events).forEach((eventName) => {
    if (eventName.startsWith('~')) return;
    const event = events[eventName];
    const eventPath = `${path}.${eventName}`;
    // Action ids are unique per event, across try, catch and control branches.
    walk.actionIds = new Set();
    let count = 0;
    if (type.isArray(event)) {
      count = checkActionList({ actions: event, path: eventPath, walk });
    } else if (type.isObject(event) && getOperatorType(event) === null) {
      count += checkActionList({ actions: event.try ?? [], path: `${eventPath}.try`, walk });
      count += checkActionList({ actions: event.catch ?? [], path: `${eventPath}.catch`, walk });
    } else {
      errors.push(literalError({ path: eventPath, what: `Event "${eventName}"`, policy }));
    }
    if (count > policy.limits.actionsPerEvent) {
      errors.push({
        path: eventPath,
        rule: 'limits.actionsPerEvent',
        message: `Event "${eventName}" has ${count} actions. Dynamic policy "${policy.id}" allows ${policy.limits.actionsPerEvent}.`,
      });
    }
  });
}

export default checkEvents;
