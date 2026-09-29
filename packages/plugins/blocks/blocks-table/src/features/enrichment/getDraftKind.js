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

import COLUMN_KINDS from '@lowdefy/blocks-antd/table/columnKinds.js';

// The kind a column's picker draft edits: the column's own, or for an error column (`invalid`,
// its kind removed) the kind its config asked for, when that is a known kind.
function getDraftKind({ raw, column }) {
  if (column.invalid === undefined) return column.kind ?? 'input';
  return Object.hasOwn(COLUMN_KINDS, raw.kind) ? raw.kind : 'input';
}

export default getDraftKind;
