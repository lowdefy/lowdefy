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

import { COLUMNS, GAP, ROWS } from '../../arrangement.js';

// The class maps are keyed by the column and row counts, so the schema enums are
// those keys read back as numbers — YAML config writes `columns: 12`, not `'12'`.
const columnCounts = Object.keys(COLUMNS).map(Number);
const rowCounts = Object.keys(ROWS).map(Number);

export default {
  category: 'container',
  icons: [],
  valueType: null,
  hazards: [],
  slots: {
    content: 'Child blocks placed in the grid.',
  },
  cssKeys: {
    element: 'The Grid container element.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      columns: {
        type: 'integer',
        enum: columnCounts,
        default: 24,
        description:
          'Number of columns in the grid. A child spans columns with a class of its own, like "col-span-8".',
      },
      columnsSm: {
        type: 'integer',
        enum: columnCounts,
        description: 'Number of columns from the sm breakpoint (640px) up.',
      },
      columnsMd: {
        type: 'integer',
        enum: columnCounts,
        description: 'Number of columns from the md breakpoint (768px) up.',
      },
      rows: {
        type: 'integer',
        enum: rowCounts,
        description:
          'Number of explicit rows. Left unset, the grid adds rows as the children need them.',
      },
      gap: {
        type: 'string',
        enum: Object.keys(GAP),
        default: 'md',
        description: 'Space between the children.',
      },
    },
  },
};
