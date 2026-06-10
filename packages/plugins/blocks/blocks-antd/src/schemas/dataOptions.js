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

// Shared properties for the data-driven way of populating a selector, as an alternative to
// `options` (label/value pairs). See concepts/selectors docs for the two ways to drive a selector.

export const data = {
  type: 'array',
  description:
    'Alternative to `options`: an array of raw rows. Each row is rendered to a label with the `html` template, and `valueKey` selects which field becomes the value. Use this to drive a selector directly from data without building label/value pairs in your request.',
};

export const html = {
  type: 'string',
  description:
    'Nunjucks template that renders each option label when using `data`. The context exposes `item` (the current row) and `index` (the zero-based row index). Ignored when `options` is used.',
};

export const valueKey = {
  type: 'string',
  description:
    'Field used as the selected value. With `options` it names the value field (defaults to "value"). With `data` it names the field stored when an option is selected; omit it to store the whole row. Supports dotted paths (e.g. "user.id").',
};

export const primaryKey = {
  type: 'string',
  description:
    'Field used to match the current value (e.g. set with SetState) back to an option for highlighting. Defaults to `valueKey`. Set this when the stored value is the whole row but a single field (e.g. "id") uniquely identifies it. In the tree selectors it also serves as each node’s id, referenced by `parentKey`. Supports dotted paths.',
};

export const parentKey = {
  type: 'string',
  description:
    'Tree selectors only: names each row’s parent id. Build a flat `data`/`options` array where each row has a `primaryKey` (its own id) and a `parentKey` whose value equals the parent row’s `primaryKey`. Rows whose `parentKey` is empty or points at no row become tree roots. Supports dotted paths.',
};
