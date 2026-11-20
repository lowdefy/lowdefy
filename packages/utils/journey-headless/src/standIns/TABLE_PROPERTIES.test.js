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

import { Table } from '@lowdefy/blocks-table/metas';
import { expect, test } from 'vitest';

import TABLE_PROPERTIES from './TABLE_PROPERTIES.js';

const CLASSED = Object.values(TABLE_PROPERTIES).flat();

test('every Table property is classed modelled, looks-only or browser-only, once', () => {
  const names = Object.keys(Table.properties.properties);
  expect(names.filter((name) => !CLASSED.includes(name))).toEqual([]);
  expect(CLASSED.filter((name, index) => CLASSED.indexOf(name) !== index)).toEqual([]);
});

test('every classed Table property is in its meta', () => {
  const names = Object.keys(Table.properties.properties);
  expect(CLASSED.filter((name) => !names.includes(name))).toEqual([]);
});
