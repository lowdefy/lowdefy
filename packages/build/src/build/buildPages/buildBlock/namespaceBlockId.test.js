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

import namespaceBlockId from './namespaceBlockId.js';

test('namespaceBlockId joins the prefix and the id with a dot', () => {
  expect(namespaceBlockId({ prefix: 'pill_a', id: 'label' })).toBe('pill_a.label');
});

test('namespaceBlockId keeps a List "$" index segment', () => {
  expect(namespaceBlockId({ prefix: 'rows.$.pill', id: 'label' })).toBe('rows.$.pill.label');
  expect(namespaceBlockId({ prefix: 'pill', id: 'rows.$.cell' })).toBe('pill.rows.$.cell');
});

test('namespaceBlockId throws on an empty path segment', () => {
  expect(() => namespaceBlockId({ prefix: 'pill', id: 'a..b' })).toThrow(
    'Block id "a..b" has an empty path segment.'
  );
});

test('namespaceBlockId throws on a reserved marker segment', () => {
  expect(() => namespaceBlockId({ prefix: 'pill', id: '~k' })).toThrow(
    'has a reserved path segment "~k"'
  );
});

test('namespaceBlockId throws when the prefix is not a non-empty string', () => {
  expect(() => namespaceBlockId({ prefix: '', id: 'label' })).toThrow(
    'Block id prefix should be a non-empty string.'
  );
  expect(() => namespaceBlockId({ prefix: undefined, id: 'label' })).toThrow(
    'Block id prefix should be a non-empty string.'
  );
});

test('namespaceBlockId throws when the id is not a non-empty string', () => {
  expect(() => namespaceBlockId({ prefix: 'pill', id: '' })).toThrow(
    'Block id should be a non-empty string.'
  );
});
