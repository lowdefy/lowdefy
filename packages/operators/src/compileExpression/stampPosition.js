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

/* eslint-disable no-param-reassign */

import { type } from '@lowdefy/helpers';

function setMarker(node, prop, value) {
  Object.defineProperty(node, prop, {
    value,
    enumerable: false,
    writable: true,
    configurable: true,
  });
}

// Attributes every object/array node in a compiled tree to the source scalar:
// ~l (line) and ~c (column) on all nodes so any node's error resolves to the
// expression, plus ~x (the original expression source) on the root only, for
// error messages. Markers are non-enumerable, matching addLineNumbers' ~l, so
// they survive to addKeys (which copies them into the keyMap) and are excluded
// from serialization and operator recognition.
function stampNode({ node, line, column }) {
  if (type.isArray(node)) {
    if (line != null) setMarker(node, '~l', line);
    if (column != null) setMarker(node, '~c', column);
    node.forEach((item) => stampNode({ node: item, line, column }));
    return;
  }
  if (type.isObject(node)) {
    if (line != null) setMarker(node, '~l', line);
    if (column != null) setMarker(node, '~c', column);
    Object.keys(node).forEach((key) => stampNode({ node: node[key], line, column }));
  }
}

function stampPosition({ tree, line, column, expression }) {
  stampNode({ node: tree, line, column });
  if ((type.isObject(tree) || type.isArray(tree)) && expression != null) {
    setMarker(tree, '~x', expression);
  }
  return tree;
}

export default stampPosition;
