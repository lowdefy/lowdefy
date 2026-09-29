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

import AI_OUTPUT_TYPES from '@lowdefy/blocks-antd/table/aiOutputTypes.js';
import CELL_TYPE_FAMILIES from '@lowdefy/blocks-antd/table/cellTypeFamilies.js';

// The cell type an error column's draft starts from: the type its config asked for, when the
// kind can have it (an ai column answers one of AI_OUTPUT_TYPES), else text.
function getDraftType({ raw, kind }) {
  const wanted = raw.output?.type ?? raw.type;
  if (kind === 'ai') return AI_OUTPUT_TYPES.includes(wanted) ? wanted : 'text';
  return Object.hasOwn(CELL_TYPE_FAMILIES, wanted ?? '') ? wanted : 'text';
}

export default getDraftType;
