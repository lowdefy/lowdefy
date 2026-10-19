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

import fs from 'fs';

import fieldTypes from './fieldTypes.js';

// The Table's filter operators, per cell type, as @lowdefy/blocks-antd offers them in its filter
// menus. The same fixture is checked into blocks-antd (test/tableFilterOperators.json) and
// tested against its operator table there, so drift on either side fails a test.
const clientOperators = JSON.parse(
  fs.readFileSync(new URL('../../../../test/tableFilterOperators.json', import.meta.url), 'utf8')
);

test('every data cell type the Table can filter is a field type with exactly its operators', () => {
  Object.entries(clientOperators)
    .filter(([, operators]) => operators.length > 0)
    .forEach(([cellType, operators]) => {
      expect([cellType, [...(fieldTypes[cellType]?.operators ?? [])].sort()]).toEqual([
        cellType,
        operators,
      ]);
    });
});

test('cell types without filter operators are not field types', () => {
  Object.entries(clientOperators)
    .filter(([, operators]) => operators.length === 0)
    .forEach(([cellType]) => {
      expect(fieldTypes[cellType]).toBeUndefined();
    });
});

test('every field type is a Table cell type', () => {
  Object.keys(fieldTypes).forEach((fieldType) => {
    expect(Object.keys(clientOperators)).toContain(fieldType);
  });
});
