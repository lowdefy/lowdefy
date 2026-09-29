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

const KIND_ENTRIES = {
  input: { label: 'Input', description: 'A value people type in.' },
  formula: { label: 'Formula', description: 'A template over the row’s other columns.' },
  ai: { label: 'AI', description: 'An AI prompt run for every row.' },
  extract: { label: 'Extract', description: 'A value from another column’s result.' },
};

// The add-column picker's kind list (design E3): input, formula, one entry per provider in the
// catalogue (enrichment columns), AI and extract, limited to the kinds the table allows. Extract
// needs an enrichment or ai column to read from. A catalogue provider with id `ai` is the AI
// kind's provider (ai columns call `ai` by default), so it replaces the built-in AI entry's
// title and description instead of showing twice. Each entry is `{ id, kind, provider?, label,
// description }`.
function getPickerKinds({ kinds, providers, hasSources }) {
  const entries = [];
  const aiProvider = providers.find((provider) => provider.id === 'ai');
  kinds.forEach((kind) => {
    if (kind === 'enrichment') {
      providers.forEach((provider) => {
        if (provider.id === 'ai') return;
        entries.push({
          id: `provider:${provider.id}`,
          kind,
          provider: provider.id,
          label: provider.title,
          description: provider.description ?? 'An enrichment provider run for every row.',
        });
      });
      return;
    }
    if (kind === 'extract' && !hasSources) return;
    if (kind === 'ai' && aiProvider) {
      entries.push({
        id: kind,
        kind,
        label: aiProvider.title,
        description: aiProvider.description ?? KIND_ENTRIES.ai.description,
      });
      return;
    }
    entries.push({ id: kind, kind, ...KIND_ENTRIES[kind] });
  });
  return entries;
}

export default getPickerKinds;
