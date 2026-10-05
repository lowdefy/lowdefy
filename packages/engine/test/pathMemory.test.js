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

import lookupPath from '../src/lookupPath.js';
import rememberPath from '../src/rememberPath.js';

const pattern = 'tickets/{space}/{ticket_id}';

test('rememberPath records the page, its values as strings and its instance key', () => {
  const lowdefy = { pathMemory: new Map() };
  const entry = rememberPath({
    lowdefy,
    path: 'tickets/support/1',
    pageId: 'ticket',
    pathParams: { space: 'support', ticket_id: 1, unused: 'x' },
    pattern,
  });
  expect(entry).toEqual({
    pageId: 'ticket',
    pathParams: { space: 'support', ticket_id: '1' },
    instanceKey: 'page:ticket#tickets/support/1',
  });
  expect(lookupPath({ lowdefy, path: 'tickets/support/1' })).toEqual(entry);
});

test('rememberPath gives a page without a pattern no values and its page key', () => {
  const lowdefy = { pathMemory: new Map() };
  expect(rememberPath({ lowdefy, path: 'about', pageId: 'about', pathParams: { a: 1 } })).toEqual({
    pageId: 'about',
    pathParams: {},
    instanceKey: 'page:about',
  });
});

test('lookupPath reads an unknown path as a page id', () => {
  const lowdefy = { pathMemory: new Map() };
  expect(lookupPath({ lowdefy, path: 'admin/users' })).toEqual({
    pageId: 'admin/users',
    pathParams: {},
    instanceKey: 'page:admin/users',
  });
});

test('lookupPath does not read inherited object keys as remembered paths', () => {
  const lowdefy = { pathMemory: new Map() };
  expect(lookupPath({ lowdefy, path: 'constructor' }).pageId).toEqual('constructor');
});
