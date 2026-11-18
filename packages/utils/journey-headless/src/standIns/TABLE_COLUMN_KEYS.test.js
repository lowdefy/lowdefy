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

import columnNeedsEditing from '@lowdefy/blocks-antd/table/columnNeedsEditing.js';
import columnNeedsEnrichment from '@lowdefy/blocks-antd/table/columnNeedsEnrichment.js';
import { Table } from '@lowdefy/blocks-table/metas';
import { expect, test } from 'vitest';

import TABLE_COLUMN_KEYS from './TABLE_COLUMN_KEYS.js';

const CLASSED = Object.values(TABLE_COLUMN_KEYS).flat();
const COLUMN = Table.properties.properties.columns.items.properties;

function needsFeature(column) {
  return columnNeedsEnrichment(column) || columnNeedsEditing(column);
}

test('every Table column key is classed browser-only or headless, once', () => {
  const names = Object.keys(COLUMN);
  expect(names.filter((name) => !CLASSED.includes(name))).toEqual([]);
  expect(CLASSED.filter((name, index) => CLASSED.indexOf(name) !== index)).toEqual([]);
});

test('every classed Table column key is in its meta, defaultColumn keys included', () => {
  const names = Object.keys(COLUMN);
  expect(CLASSED.filter((name) => !names.includes(name))).toEqual([]);
  const defaults = Object.keys(Table.properties.properties.defaultColumn.properties);
  expect(defaults.filter((name) => !names.includes(name))).toEqual([]);
});

test('each browser-only column key loads a feature by blocks-table rules', () => {
  const samples = {
    editable: { editable: true },
    kind: { kind: 'ai' },
    status: { status: { field: 'run' } },
    userDefined: { userDefined: true },
  };
  expect(Object.keys(samples).sort()).toEqual([...TABLE_COLUMN_KEYS.browserOnly].sort());
  Object.values(samples).forEach((column) => {
    expect(needsFeature({ key: 'a', ...column })).toBe(true);
  });
});

test('every Table column kind loads enrichment or is one the stand-in models', () => {
  const kinds = COLUMN.kind.enum;
  expect(kinds.filter((kind) => !needsFeature({ key: 'a', kind }))).toEqual(['input', 'formula']);
});
