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

import getInputField from './getInputField.js';

function buildInputs(inputs) {
  const built = {};
  Object.entries(inputs ?? {}).forEach(([param, input]) => {
    if (input?.mode === 'value') {
      if (!type.isNone(input.value) && input.value !== '') built[param] = { value: input.value };
      return;
    }
    if (type.isString(input?.column) && input.column !== '')
      built[param] = { column: input.column };
  });
  return built;
}

// The column config the add-column picker submits (onColumnAdd, onColumnUpdate): `{ key, title,
// type, kind, userDefined: true }` plus the chosen kind's keys (design E2), from the picker's
// draft. Input columns are editable, with their field under `inputFieldPrefix` when the table
// sets one. An ai column's output type is its column type, and its
// inputs are the columns its prompt references (syncPromptInputs keeps them in step).
function buildColumnConfig({ draft, key, inputFieldPrefix = null }) {
  const column = {
    key,
    title: draft.title.trim(),
    type: draft.type,
    kind: draft.kind,
    userDefined: true,
  };
  switch (draft.kind) {
    case 'input':
      column.editable = true;
      if (inputFieldPrefix !== null) column.field = getInputField({ key, inputFieldPrefix });
      break;
    case 'formula':
      column.template = draft.template;
      break;
    case 'enrichment':
      column.provider = draft.provider;
      column.inputs = buildInputs(draft.inputs);
      if (draft.output.trim() !== '') column.output = draft.output.trim();
      column.autoRun = draft.autoRun === true;
      break;
    case 'ai':
      column.prompt = draft.prompt;
      column.inputs = buildInputs(draft.inputs);
      // Only tag and tags answers take options (the answers allowed).
      column.output =
        ['tag', 'tags'].includes(draft.type) && draft.outputOptions.length > 0
          ? { type: draft.type, options: draft.outputOptions }
          : { type: draft.type };
      column.autoRun = draft.autoRun === true;
      break;
    case 'extract':
      column.source = draft.source;
      column.path = draft.path.trim();
      break;
    default:
      break;
  }
  return column;
}

export default buildColumnConfig;
