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

const DEFAULT_INDENT = 20;

// `tree: { childrenField }` (nested rows) or `{ parentField }` (flat rows naming their parent's
// row key). `lazy: true` shows a chevron on rows whose `hasChildrenField` is true before their
// children are in `data`, and the app loads them on `onRowExpand`.
function normalizeTree({ tree, server }) {
  if (type.isNone(tree)) return null;
  if (server) {
    throw new Error('Table "tree" needs client data; server mode does not support trees.');
  }
  if (!type.isObject(tree)) {
    throw new Error(`Table "tree" must be an object. Received ${JSON.stringify(tree)}.`);
  }
  const { childrenField, parentField } = tree;
  if (type.isString(childrenField) === type.isString(parentField)) {
    throw new Error(
      `Table "tree" requires one of "childrenField" or "parentField". Received ${JSON.stringify(
        tree
      )}.`
    );
  }
  const lazy = tree.lazy === true;
  return {
    childrenField: type.isString(childrenField) ? childrenField : null,
    parentField: type.isString(parentField) ? parentField : null,
    lazy,
    hasChildrenField: lazy ? tree.hasChildrenField ?? 'hasChildren' : null,
    indent: tree.indent ?? DEFAULT_INDENT,
  };
}

export default normalizeTree;
