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

import humanizeKey from '@lowdefy/blocks-antd/table/humanizeKey.js';
import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';
import resolveEnrichmentInputs from '@lowdefy/blocks-antd/table/resolveEnrichmentInputs.js';

// An input's name in the details panel: an ai column's inputs are its prompt placeholders, an
// enrichment column's are its provider's inputs, titled in the catalogue.
function getParamLabel({ column, param, provider }) {
  if (column.kind === 'ai') return `{{ ${param} }}`;
  const input = (provider?.inputs ?? []).find((entry) => entry.key === param);
  return input?.title ?? humanizeKey(param);
}

// The rows of the details panel's Inputs section, one per input the column declares, in order:
// `{ param, label, value, missing }` plus `columnTitle` for a `{ column }` input ("Full name ←
// Person") or `literal: true` for a `{ value }` input ("Region = EU"). `value` is what the run
// reads from the row now (resolveEnrichmentInputs, as the server resolves it); `missing` when a
// column input has none.
function getInputRows({ column, row, columnsByKey, provider }) {
  const resolved = resolveEnrichmentInputs({ column, row });
  return Object.entries(column.inputs ?? {}).map(([param, source]) => {
    const base = {
      param,
      label: getParamLabel({ column, param, provider }),
      value: resolved[param],
      missing: !Object.hasOwn(resolved, param),
    };
    if (Object.hasOwn(source, 'value')) return { ...base, literal: true };
    const input = columnsByKey.get(source.column);
    return { ...base, columnTitle: input ? htmlToText(input.title) : source.column };
  });
}

export default getInputRows;
