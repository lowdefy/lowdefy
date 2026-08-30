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

import resolveUpdateFieldSchema from './resolveUpdateFieldSchema.js';

const fields = {
  test_id: { type: 'string' },
  evidence_ids: { type: 'array', items: { type: 'string' } },
  address: { type: 'object', properties: { city: { type: 'string' } } },
  bare: { type: 'object' },
};

test('resolveUpdateFieldSchema returns the field schema for a top-level key', () => {
  expect(resolveUpdateFieldSchema({ fields, path: 'test_id' })).toBe(fields.test_id);
});

test('resolveUpdateFieldSchema returns null for an undeclared key', () => {
  expect(resolveUpdateFieldSchema({ fields, path: 'other' })).toBe(null);
  expect(resolveUpdateFieldSchema({ fields, path: 'other.deep' })).toBe(null);
});

test('resolveUpdateFieldSchema walks properties for object segments', () => {
  expect(resolveUpdateFieldSchema({ fields, path: 'address.city' })).toBe(
    fields.address.properties.city
  );
  expect(resolveUpdateFieldSchema({ fields, path: 'address.postcode' })).toBe(null);
  expect(resolveUpdateFieldSchema({ fields, path: 'bare.anything' })).toBe(null);
});

test('resolveUpdateFieldSchema walks items for array positions', () => {
  expect(resolveUpdateFieldSchema({ fields, path: 'evidence_ids.0' })).toBe(
    fields.evidence_ids.items
  );
  expect(resolveUpdateFieldSchema({ fields, path: 'evidence_ids.$' })).toBe(
    fields.evidence_ids.items
  );
  expect(resolveUpdateFieldSchema({ fields, path: 'evidence_ids.$[]' })).toBe(
    fields.evidence_ids.items
  );
  expect(resolveUpdateFieldSchema({ fields, path: 'evidence_ids.$[el]' })).toBe(
    fields.evidence_ids.items
  );
  expect(resolveUpdateFieldSchema({ fields, path: 'test_id.0' })).toBe(null);
});
