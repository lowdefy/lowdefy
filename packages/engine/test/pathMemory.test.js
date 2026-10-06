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
import rememberTarget from '../src/rememberTarget.js';
import resolveTarget from '../src/resolveTarget.js';

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

function createLowdefy() {
  return {
    home: { configured: false, pageId: 'ticket', pathParams: { space: 's', ticket_id: 9 } },
    linkPaths: {},
    pagePaths: { ticket: pattern },
    pathMemory: new Map(),
  };
}

test('rememberTarget records the page a resolved page target names under its path', () => {
  const lowdefy = createLowdefy();
  const target = resolveTarget({
    lowdefy,
    target: {
      pageId: 'ticket',
      pathParams: { space: 'support', ticket_id: 1 },
      urlQuery: { a: 1 },
    },
  });
  rememberTarget({ lowdefy, target });
  expect([...lowdefy.pathMemory.entries()]).toEqual([
    [
      'tickets/support/1',
      {
        pageId: 'ticket',
        pathParams: { space: 'support', ticket_id: '1' },
        instanceKey: 'page:ticket#tickets/support/1',
      },
    ],
  ]);
  expect(lookupPath({ lowdefy, path: 'tickets/support/1' }).instanceKey).toEqual(
    target.instanceKey
  );
});

test('rememberTarget records a home target', () => {
  const lowdefy = createLowdefy();
  rememberTarget({ lowdefy, target: resolveTarget({ lowdefy, target: { home: true } }) });
  expect(lowdefy.pathMemory.get('tickets/s/9')).toEqual({
    pageId: 'ticket',
    pathParams: { space: 's', ticket_id: '9' },
    instanceKey: 'page:ticket#tickets/s/9',
  });
});

test('rememberTarget writes nothing for a url target', () => {
  const lowdefy = createLowdefy();
  rememberTarget({ lowdefy, target: resolveTarget({ lowdefy, target: { url: '/tickets/s/1' } }) });
  rememberTarget({ lowdefy, target: { kind: 'external', href: 'https://example.com/' } });
  expect(lowdefy.pathMemory.size).toBe(0);
});
