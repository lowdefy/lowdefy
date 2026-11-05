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

import { get, type } from '@lowdefy/helpers';

import getRefPath from './getRefPath.js';
import makeId from '../../utils/makeId.js';

// Refs that share a walker path (a file whose root content is itself a _ref, a
// _ref in another ref's vars) take the first free `<base>~<n>`. Refs resolve in
// parallel, so the base is chosen so that only refs registered in a fixed order
// compete for it: a file's root ref builds on its parent's id, which holds the
// same position, and any other shared position builds on the walker path.
function makeSharedPathId({ walkerPath, parent, refMap }) {
  const parentHoldsPath = parent === walkerPath || parent?.startsWith(`${walkerPath}~`);
  const base = parentHoldsPath ? parent : walkerPath;
  let suffix = 1;
  while (refMap[`${base}~${suffix}`] !== undefined) {
    suffix += 1;
  }
  return `${base}~${suffix}`;
}

// The walker path makes the id deterministic under parallel resolution. Refs
// with no walker path (the root ref, module manifests, JIT page builds) take a
// counter id.
function makeRefId({ walkerPath, parent, refMap }) {
  if (type.isNone(walkerPath)) {
    return makeId.next();
  }
  if (type.isUndefined(refMap[walkerPath])) {
    return walkerPath;
  }
  return makeSharedPathId({ walkerPath, parent, refMap });
}

function makeRefDefinition(refDefinition, parent, refMap, lineNumber, walkerPath) {
  const id = makeRefId({ walkerPath, parent, refMap });
  const refDef = {
    parent,
    lineNumber,
  };
  refMap[id] = refDef;
  const ignoreBuildChecks = get(refDefinition, '~ignoreBuildChecks');
  return {
    ...refDef,
    id,
    key: get(refDefinition, 'key'),
    original: refDefinition,
    path: getRefPath(refDefinition),
    resolver: get(refDefinition, 'resolver'),
    transformer: get(refDefinition, 'transformer'),
    vars: get(refDefinition, 'vars', { default: {} }),
    module: get(refDefinition, 'module'),
    component: get(refDefinition, 'component'),
    menu: get(refDefinition, 'menu'),
    page: get(refDefinition, 'page'),
    connection: get(refDefinition, 'connection'),
    api: get(refDefinition, 'api'),
    ...(ignoreBuildChecks !== undefined && { ignoreBuildChecks }),
  };
}

export default makeRefDefinition;
