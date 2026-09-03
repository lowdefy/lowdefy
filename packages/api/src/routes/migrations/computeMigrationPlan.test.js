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

import computeMigrationPlan from './computeMigrationPlan.js';

const index = [
  { id: 'm1', checksum: 'a1' },
  { id: 'm2', checksum: 'b2' },
  { id: 'm3', checksum: 'c3' },
];

test('computeMigrationPlan returns every migration as pending when the ledger is empty', () => {
  const result = computeMigrationPlan({ index, applied: [] });
  expect(result.pending.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
  expect(result.mismatches).toEqual([]);
  expect(result.missingFiles).toEqual([]);
});

test('computeMigrationPlan excludes already-applied migrations', () => {
  const applied = [
    { id: 'm1', checksum: 'a1' },
    { id: 'm2', checksum: 'b2' },
  ];
  const result = computeMigrationPlan({ index, applied });
  expect(result.pending.map((m) => m.id)).toEqual(['m3']);
});

test('computeMigrationPlan keeps index order even when a later migration was applied first', () => {
  const applied = [{ id: 'm2', checksum: 'b2' }];
  const result = computeMigrationPlan({ index, applied });
  expect(result.pending.map((m) => m.id)).toEqual(['m1', 'm3']);
});

test('computeMigrationPlan reports a checksum mismatch without throwing', () => {
  const applied = [{ id: 'm1', checksum: 'DIFFERENT' }];
  const result = computeMigrationPlan({ index, applied });
  expect(result.mismatches).toEqual([
    { id: 'm1', appliedChecksum: 'DIFFERENT', builtChecksum: 'a1' },
  ]);
  // m1 is applied (by id), so it is not pending despite the mismatch.
  expect(result.pending.map((m) => m.id)).toEqual(['m2', 'm3']);
});

test('computeMigrationPlan --to limits pending to migrations up to and including the id', () => {
  const result = computeMigrationPlan({ index, applied: [], options: { to: 'm2' } });
  expect(result.pending.map((m) => m.id)).toEqual(['m1', 'm2']);
});

test('computeMigrationPlan throws a ConfigError for an unknown --to', () => {
  expect(() => computeMigrationPlan({ index, applied: [], options: { to: 'nope' } })).toThrow(
    'Migration "--to nope" is not a known migration'
  );
});

test('computeMigrationPlan reports an applied migration with no file as missingFiles', () => {
  const applied = [
    { id: 'm1', checksum: 'a1' },
    { id: 'old-deleted', checksum: 'zz' },
  ];
  const result = computeMigrationPlan({ index, applied });
  expect(result.missingFiles).toEqual(['old-deleted']);
});

test('computeMigrationPlan tolerates an empty index', () => {
  const result = computeMigrationPlan({ index: [], applied: [] });
  expect(result.pending).toEqual([]);
});
