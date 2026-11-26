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

// Walk up from ~r to find the source file a page or endpoint is resolved from
// on its own. Templates receive vars (they need id, title, etc. from the file
// that refs them), while source files are self-contained or receive vars from
// a collection file. Stop at the first ref called WITHOUT vars — that's the
// source file. When ALL refs have vars (module pages), fall back to the first
// child of root. When the child of root has no path (resolver ref), go
// shallower — capture the resolver's info so it can be re-run with freshly
// resolved vars. refId is the source's ref: every ref the source's content
// reads descends from it.
function findSourceRef({ refId, refMap, unresolvedRefVars }) {
  let current = refId;
  let firstChildOfRoot = null;

  while (!type.isNone(current)) {
    const entry = refMap[current];
    if (!entry) {
      return null;
    }

    const hasVars = !type.isNone(unresolvedRefVars[current]);

    // Track the first child of root as fallback
    const parentEntry = !type.isNone(entry.parent) ? refMap[entry.parent] : null;
    if (parentEntry && type.isNone(parentEntry.parent) && !firstChildOfRoot) {
      // Resolver ref: capture the resolver's original definition and vars
      // so it can be re-run (instead of falling through to the template file
      // below it, which would discard the resolver's vars).
      firstChildOfRoot = entry.path
        ? {
            refId: current,
            path: entry.path,
            unresolvedVars: unresolvedRefVars[current] ?? null,
            transformer: entry.transformer ?? null,
          }
        : { refId: current, path: null, original: refMap[current].original };
    }

    // First ref without vars = self-contained source file
    if (!hasVars) {
      if (!type.isNone(entry.parent)) {
        return {
          refId: current,
          path: entry.path,
          unresolvedVars: null,
          transformer: entry.transformer ?? null,
        };
      }
      // Reached root — use first child of root
      return firstChildOfRoot;
    }

    current = entry.parent;
  }
  return firstChildOfRoot;
}

export default findSourceRef;
