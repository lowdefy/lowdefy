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

import tableLightMeta from '@lowdefy/blocks-antd/blocks/TableLight/meta.js';
import TABLE_ONLY_KEYS from '@lowdefy/blocks-antd/blocks/TableLight/tableOnlyKeys.js';

import tableMeta from './blocks/Table/meta.js';

// TableLight is a strict subset of Table: every Table key TableLight does not take must be in
// its Table-only list, so using it on TableLight says "use Table" instead of a bare unknown key.
function missingKeys({ table, light, tableOnly }) {
  return Object.keys(table).filter((key) => light[key] === undefined && !tableOnly[key]);
}

const table = tableMeta.properties.properties;
const light = tableLightMeta.properties.properties;

test('every Table property TableLight lacks is a Table-only key', () => {
  expect(missingKeys({ table, light, tableOnly: TABLE_ONLY_KEYS.properties })).toEqual([]);
});

test('every Table column key TableLight lacks is a Table-only key', () => {
  expect(
    missingKeys({
      table: table.columns.items.properties,
      light: light.columns.items.properties,
      tableOnly: TABLE_ONLY_KEYS.columns,
    })
  ).toEqual([]);
});

test('every Table defaultColumn key TableLight lacks is a Table-only key', () => {
  expect(
    missingKeys({
      table: table.defaultColumn.properties,
      light: light.defaultColumn.properties,
      tableOnly: { ...TABLE_ONLY_KEYS.columns, ...TABLE_ONLY_KEYS.defaultColumn },
    })
  ).toEqual([]);
});
