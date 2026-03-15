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

import { get } from '@lowdefy/helpers';

import getRefPath from './getRefPath.js';
import makeId from '../../utils/makeId.js';

function makeRefDefinition(refDefinition, parent, refMap, lineNumber, walkerPath) {
  // Use walker tree path when available for deterministic IDs under parallel
  // resolution. Falls back to counter for root ref and JIT-created refs.
  // When a file's root content is itself a _ref, both the outer and inner refs
  // share the same walker path. Fall back to counter to avoid overwriting the
  // outer ref's refMap entry (which would create a self-referencing parent).
  const id = walkerPath != null && refMap[walkerPath] === undefined ? walkerPath : makeId.next();
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
    ...(ignoreBuildChecks !== undefined && { ignoreBuildChecks }),
  };
}

export default makeRefDefinition;
