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

import makeId from '../../../utils/makeId.js';
import setNonEnumerableProperty from '../../../utils/setNonEnumerableProperty.js';

function rekeyNode({ node, parentKey, keyMap, skip }) {
  if (skip.has(node)) return;

  let childParentKey = parentKey;
  const templateKey = node['~k'];
  if (!type.isUndefined(templateKey)) {
    // A component body restored from the componentDefs.json artifact carries
    // the keys of the build that wrote it, which are not in this build's
    // keyMap (JIT dev builds). The instance still needs its own key; its entry
    // then resolves through the parent chain instead of the body's own line.
    const templateEntry = keyMap[templateKey] ?? {};
    const instanceNodeKey = makeId.next();
    keyMap[instanceNodeKey] = {
      ...templateEntry,
      '~k_parent': parentKey,
      // A body cloned into a body cloned into a page: name the authored node,
      // not the intermediate instance, so resolution is always one hop.
      '~k_source': templateEntry['~k_source'] ?? templateKey,
    };
    setNonEnumerableProperty(node, '~k', instanceNodeKey);
    childParentKey = instanceNodeKey;
  }

  const children = type.isArray(node) ? node : Object.keys(node).map((key) => node[key]);
  children.forEach((child) => {
    if (type.isObject(child) || type.isArray(child)) {
      rekeyNode({ node: child, parentKey: childParentKey, keyMap, skip });
    }
  });
}

// Gives every node of an expanded instance — a component body cloned per use
// site, a prop expression inlined into it, an archetype's generated tree — a
// key of its own. Without this, two instances of one component share the ~k of
// the template they were cloned from: they report the same config location, an
// ~ignoreBuildChecks on one suppresses the other, and one key names two
// structurally different operator sites on a page.
//
// Each new entry copies the template's entry (so ~r/~l still point at the
// component body's file and line, and the template's ~ignoreBuildChecks still
// applies), re-parents it inside the instance, and records the template key as
// ~k_source.
//
// `skip` holds nodes that are not clones — the consumer's own blocks filling a
// slot. They keep their keys, and their subtrees are left untouched.
function rekeyInstance({ tree, instanceKey, keyMap, skip = new Set() }) {
  if (!type.isObject(tree) && !type.isArray(tree)) return tree;
  rekeyNode({ node: tree, parentKey: instanceKey, keyMap, skip });
  return tree;
}

export default rekeyInstance;
