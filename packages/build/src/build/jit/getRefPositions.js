/*
  Copyright 2020-2024 Lowdefy, Inc

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

function getRefPositions(content, basePath) {
  const positions = new Map();
  walk(content, basePath, positions);
  return positions;
}

function walk(node, path, positions) {
  if (type.isObject(node)) {
    if (node._ref && node._ref.id !== undefined) {
      positions.set(node._ref.id, path);
      return;
    }
    for (const key of Object.keys(node)) {
      const childPath = path ? `${path}.${key}` : key;
      walk(node[key], childPath, positions);
    }
  } else if (type.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const childPath = path ? `${path}.${i}` : `${i}`;
      walk(node[i], childPath, positions);
    }
  }
}

export default getRefPositions;
