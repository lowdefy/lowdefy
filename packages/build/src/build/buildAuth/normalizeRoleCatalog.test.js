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

import normalizeRoleCatalog from './normalizeRoleCatalog.js';

test('normalizeRoleCatalog returns an empty array when roles is undefined', () => {
  expect(normalizeRoleCatalog(undefined)).toEqual([]);
});

test('normalizeRoleCatalog returns an empty array when roles is empty', () => {
  expect(normalizeRoleCatalog([])).toEqual([]);
});

test('normalizeRoleCatalog defaults label to id when label is absent', () => {
  expect(normalizeRoleCatalog([{ id: 'auditor' }])).toEqual([
    { id: 'auditor', label: 'auditor', description: undefined },
  ]);
});

test('normalizeRoleCatalog keeps an explicit label', () => {
  expect(normalizeRoleCatalog([{ id: 'admin', label: 'Administrator' }])).toEqual([
    { id: 'admin', label: 'Administrator', description: undefined },
  ]);
});

test('normalizeRoleCatalog passes description through', () => {
  expect(normalizeRoleCatalog([{ id: 'admin', description: 'Full access' }])).toEqual([
    { id: 'admin', label: 'admin', description: 'Full access' },
  ]);
});

test('normalizeRoleCatalog copies the ~k marker when present', () => {
  expect(normalizeRoleCatalog([{ id: 'admin', '~k': 'role-key' }])).toEqual([
    { id: 'admin', label: 'admin', description: undefined, '~k': 'role-key' },
  ]);
});

test('normalizeRoleCatalog does not add a ~k marker when absent', () => {
  const [entry] = normalizeRoleCatalog([{ id: 'admin' }]);
  expect(Object.prototype.hasOwnProperty.call(entry, '~k')).toBe(false);
});

test('normalizeRoleCatalog does not mutate its argument', () => {
  const roles = [{ id: 'admin' }];
  normalizeRoleCatalog(roles);
  expect(roles).toEqual([{ id: 'admin' }]);
});
