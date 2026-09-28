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

import assert from 'node:assert/strict';
import test from 'node:test';

import decodeViewParam from './decodeViewParam.js';
import encodeViewParam from './encodeViewParam.js';

test('encodeViewParam and decodeViewParam round-trip a view payload', () => {
  const payload = {
    view: {
      sort: [{ key: 'amount', desc: true }],
      filter: { and: [{ key: 'stage', op: 'in', value: ['lead', 'won'] }] },
      search: 'Zoë & Søren ✓',
      columns: [
        { key: 'name', width: 260, pinned: 'start' },
        { key: 'source', hidden: true },
      ],
      density: 'compact',
    },
    activeView: 'mine',
  };
  const encoded = encodeViewParam(payload);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeViewParam(encoded), payload);
});

test('decodeViewParam returns null for missing, malformed or non-object values', () => {
  assert.equal(decodeViewParam(null), null);
  assert.equal(decodeViewParam(''), null);
  assert.equal(decodeViewParam('%%%not-base64'), null);
  assert.equal(decodeViewParam(encodeViewParam([1, 2])), null);
  assert.equal(decodeViewParam(Buffer.from('{"view":').toString('base64url')), null);
});
