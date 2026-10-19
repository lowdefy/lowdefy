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

import isTrackedObject from './isTrackedObject.js';

// Marks every tracked object in an operator's result as data returned by it.
function markDataObjects({ literalData, value, operator }) {
  const pending = [value];
  while (pending.length > 0) {
    const node = pending.pop();
    if (type.isArray(node)) {
      node.forEach((item) => pending.push(item));
    } else if (type.isObject(node)) {
      if (isTrackedObject({ value: node, operators: literalData.clientOperators })) {
        literalData.dataObjects.set(node, operator);
      }
      Object.values(node).forEach((child) => pending.push(child));
    }
  }
}

export default markDataObjects;
