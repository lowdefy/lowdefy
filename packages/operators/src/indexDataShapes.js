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

import createContentHasher from './createContentHasher.js';

// Digest -> origin for every object in a value that is marked as data, or null
// when it holds none. A _function body is copied each time the function runs,
// so its copies of data are recognised by these digests as they are parsed.
function indexDataShapes({ literalData, value }) {
  const digest = createContentHasher();
  const shapes = new Map();
  // Children first, so each digest reads its children's from the hasher.
  function visit(node) {
    if (type.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (!type.isObject(node)) {
      return;
    }
    for (const key of Object.keys(node)) visit(node[key]);
    const origin = literalData.dataObjects.get(node);
    if (!type.isUndefined(origin)) {
      shapes.set(digest(node), origin);
    }
  }
  visit(value);
  return shapes.size === 0 ? null : shapes;
}

export default indexDataShapes;
