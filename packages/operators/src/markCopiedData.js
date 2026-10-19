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

import findCopySources from './findCopySources.js';
import transferDataMarks from './transferDataMarks.js';

// _get and _args return a copy of what they read. The copy keeps the structure
// of the value it was copied from, so each data mark moves to the object at the
// same position in the copy.
const COPYING_READS = new Set(['_args', '_get']);

function markCopiedData({ literalData, op, params, args, arrayIndices, copy }) {
  if (!COPYING_READS.has(op)) {
    return;
  }
  findCopySources({ op, params, args, arrayIndices }).forEach((source) =>
    transferDataMarks({ literalData, from: source, to: copy })
  );
}

export default markCopiedData;
