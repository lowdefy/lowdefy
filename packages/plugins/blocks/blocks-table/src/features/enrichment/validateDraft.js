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
import findTemplateRefs from '@lowdefy/blocks-antd/table/findTemplateRefs.js';

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

function unreadableInputs({ draft, inputKeys }) {
  const keys = new Set(inputKeys);
  const mapped = Object.values(draft.inputs ?? {})
    .filter((input) => input?.mode !== 'value' && type.isString(input?.column))
    .map((input) => input.column)
    .filter((key) => key !== '');
  const referenced = draft.kind === 'ai' ? findTemplateRefs(draft.prompt) : [];
  return [...new Set([...mapped, ...referenced])].filter((key) => !keys.has(key));
}

function unreadableProblem({ draft, inputKeys }) {
  const unreadable = unreadableInputs({ draft, inputKeys });
  if (unreadable.length === 0) return null;
  return `An input can not read ${unreadable
    .map((key) => `"${key}"`)
    .join(
      ', '
    )}: use an input, data, enrichment or AI column (formula and extract columns compute in the browser).`;
}

// Why the add-column picker cannot submit its draft yet, or null: a title, then what the kind
// needs (a template, a provider with its required inputs mapped, a prompt, a source column).
// Templates and prompts only take `{{ column }}` placeholders (findTemplateProblem), and an
// enrichment or ai column only reads the columns the server can read (`inputKeys`, from
// isEnrichmentInputColumn: not formula or extract columns), as the server's column check.
function validateDraft({ draft, provider, inputKeys }) {
  if (draft.title.trim() === '') return 'Enter a column title.';
  switch (draft.kind) {
    case 'formula':
      if (draft.template.trim() === '') return 'Enter a formula template.';
      return findTemplateProblem(draft.template);
    case 'enrichment': {
      if (!provider) return 'Choose a provider.';
      const missing = missingInputs({ draft, provider });
      if (missing.length > 0) return `Map the required inputs: ${missing.join(', ')}.`;
      return unreadableProblem({ draft, inputKeys });
    }
    case 'ai':
      if (draft.prompt.trim() === '') return 'Enter a prompt.';
      return findTemplateProblem(draft.prompt) ?? unreadableProblem({ draft, inputKeys });
    case 'extract':
      return type.isString(draft.source) ? null : 'Choose the column to extract from.';
    default:
      return null;
  }
}

export default validateDraft;
