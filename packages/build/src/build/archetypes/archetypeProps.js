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

// Per-archetype prop surfaces in the task-50 module-var shape
// ({ type, required, default, description }), validated at build by the same
// validator components use (validateComponentProps). collection is the only
// required prop of every archetype; the rest are derived from collections: or
// defaulted (design §3). Complex-shaped props (columns, filters, rowLink) are
// declared as array/object here — their inner shape is validated by the
// generator, which needs the collection schema to check field names.
const listPageProps = {
  collection: {
    type: 'string',
    required: true,
    description: 'The collection this page lists. Must be declared in collections:.',
  },
  connectionId: {
    type: 'string',
    description: "Read connection. Defaults to the collection's read connection.",
  },
  columns: {
    type: 'array',
    description: 'Fields to show as columns. Defaults to every declared field.',
  },
  filters: {
    type: 'array',
    description: 'Fields to filter on. The widget is derived from each field type.',
  },
  search: {
    type: 'array',
    description: 'Fields matched by a single search box, with a case-insensitive regex.',
  },
  rowLink: {
    type: 'object',
    description: 'Link target for a row. urlQuery/input values may use $<field> row tokens.',
  },
  sort: {
    type: 'object',
    description:
      "Default MongoDB sort. Defaults to the collection's first declared date field descending, else _id descending.",
  },
  pageSize: {
    type: 'integer',
    default: 50,
    description:
      'A cap on the number of rows fetched. The generated page has no pagination controls yet, so rows beyond this limit are not reachable.',
  },
  title: {
    type: 'string',
    description: 'Page heading. Defaults to the humanised collection name.',
  },
  emptyState: {
    type: 'object',
    description: 'Result block props shown when no rows match.',
  },
  actions: {
    type: 'array',
    description: 'Header action blocks, e.g. a New button.',
  },
  layout: {
    type: 'object',
    description: 'Root page-layout block { type, properties }. Defaults to Box.',
  },
};

const archetypeProps = {
  ListPage: listPageProps,
};

export default archetypeProps;
