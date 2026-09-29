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
import findTemplateProblem from '@lowdefy/blocks-antd/table/findTemplateProblem.js';

function missingInputs({ draft, provider }) {
  return (provider?.inputs ?? [])
    .filter((input) => input.required === true)
    .filter((input) => {
      const mapped = draft.inputs[input.key];
      if (mapped?.mode === 'value') return type.isNone(mapped.value) || mapped.value === '';
      return !type.isString(mapped?.column) || mapped.column === '';
    })
    .map((input) => input.title ?? input.key);
}

// Why the add-column picker cannot submit its draft yet, or null: a title, then what the kind
// needs (a template, a provider with its required inputs mapped, a prompt, a source column).
// Templates and prompts only take `{{ column }}` placeholders (findTemplateProblem).
function validateDraft({ draft, provider }) {
  if (draft.title.trim() === '') return 'Enter a column title.';
  switch (draft.kind) {
    case 'formula':
      if (draft.template.trim() === '') return 'Enter a formula template.';
      return findTemplateProblem(draft.template);
    case 'enrichment': {
      if (!provider) return 'Choose a provider.';
      const missing = missingInputs({ draft, provider });
      return missing.length > 0 ? `Map the required inputs: ${missing.join(', ')}.` : null;
    }
    case 'ai':
      if (draft.prompt.trim() === '') return 'Enter a prompt.';
      return findTemplateProblem(draft.prompt);
    case 'extract':
      return type.isString(draft.source) ? null : 'Choose the column to extract from.';
    default:
      return null;
  }
}

export default validateDraft;
