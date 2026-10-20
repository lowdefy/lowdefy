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

import { buildBlockSchema } from '@lowdefy/block-utils';
import { getConfigSchemaErrors } from '@lowdefy/ajv';

import * as metas from './metas.js';

// The errors the build's schema check reports for a block's properties.
function getErrors(meta, properties) {
  const schema = buildBlockSchema(meta).properties.properties;
  return getConfigSchemaErrors({ schema, data: properties });
}

const blocks = Object.entries(metas);

test.each(blocks)('%s columnDefs accept a boolean or a named filter', (name, meta) => {
  const properties = {
    columnDefs: [
      { field: 'date', filter: 'agDateColumnFilter' },
      { field: 'name', filter: true },
      { field: 'id', filter: false },
    ],
  };
  expect(getErrors(meta, properties)).toEqual([]);
});

test.each(blocks)('%s columnDefs refuse a number filter', (name, meta) => {
  const errors = getErrors(meta, { columnDefs: [{ field: 'date', filter: 3 }] });
  expect(errors).toEqual([
    expect.objectContaining({ instancePath: '/columnDefs/0/filter', keyword: 'type' }),
  ]);
});

test.each(blocks)('%s columnDefs accept a named cell renderer and tooltip', (name, meta) => {
  const properties = {
    columnDefs: [
      {
        field: 'price',
        cellRenderer: 'agAnimateShowChangeCellRenderer',
        tooltipComponent: 'customTooltip',
      },
    ],
  };
  expect(getErrors(meta, properties)).toEqual([]);
});
