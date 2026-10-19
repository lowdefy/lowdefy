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
import assignOptionColors from '@lowdefy/blocks-antd/table/assignOptionColors.js';
import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';

import createDraft from './createDraft.js';
import getDraftKind from './getDraftKind.js';
import getDraftType from './getDraftType.js';

function inputsToDraft(inputs) {
  const draft = {};
  Object.entries(inputs ?? {}).forEach(([param, input]) => {
    draft[param] = type.isString(input?.column)
      ? { mode: 'column', column: input.column }
      : { mode: 'value', value: input?.value };
  });
  return draft;
}

// The picker draft for editing a column: its config (`raw`, as the app gave it) read back into
// the draft's fields, with the title and type of the normalised column. An error column
// (`invalid`) has lost its kind, so its draft takes the kind and type its config asked for, to
// be fixed.
function draftFromColumn({ raw, column }) {
  const kind = getDraftKind({ raw, column });
  const draft = createDraft({ kind, provider: raw.provider ?? null });
  return {
    ...draft,
    title: htmlToText(column.title),
    type: column.invalid === undefined ? column.type : getDraftType({ raw, kind }),
    template: raw.template ?? '',
    inputs: inputsToDraft(raw.inputs),
    output: type.isString(raw.output) ? raw.output : '',
    outputOptions: type.isArray(raw.output?.options)
      ? assignOptionColors({ values: raw.output.options, previous: raw.output.options })
      : [],
    prompt: raw.prompt ?? '',
    autoRun: raw.autoRun === true,
    source: raw.source ?? null,
    path: raw.path ?? '',
  };
}

export default draftFromColumn;
