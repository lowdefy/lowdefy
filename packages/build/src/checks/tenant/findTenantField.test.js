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
import findTenantField from './findTenantField.js';

test('findTenantField finds the field as a key at any literal depth and collects its values', () => {
  const value = {
    pipeline: [
      { $match: { organization_id: 'a' } },
      { $lookup: { pipeline: [{ $match: { organization_id: { $in: ['b'] } } }] } },
    ],
  };
  expect(findTenantField({ value, field: 'organization_id' })).toEqual({
    found: true,
    unknown: false,
    values: ['a', { $in: ['b'] }],
  });
});

test('findTenantField reports not found for a literal tree without the key', () => {
  expect(
    findTenantField({ value: { query: { status: 'active' } }, field: 'organization_id' })
  ).toEqual({ found: false, unknown: false, values: [] });
});

test('findTenantField does not descend into operator nodes and marks the result unknown', () => {
  const value = { query: { _if: { test: true, then: { organization_id: 'a' }, else: {} } } };
  expect(findTenantField({ value, field: 'organization_id' })).toEqual({
    found: false,
    unknown: true,
    values: [],
  });
});

test('findTenantField treats _id as a literal key, not an operator node', () => {
  const value = { query: { _id: 'x', organization_id: 'a' } };
  expect(findTenantField({ value, field: 'organization_id' })).toMatchObject({ found: true });
});

test('findTenantField stays certain about a literal key next to an operator node', () => {
  const value = { query: { organization_id: 'a', status: { _payload: 'status' } } };
  expect(findTenantField({ value, field: 'organization_id' })).toEqual({
    found: true,
    unknown: true,
    values: ['a'],
  });
});
