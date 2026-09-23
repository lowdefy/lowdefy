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

import createPageContext from './createPageContext.js';

const REF_ARRAYS = [
  'callApiActionRefs',
  'dynamicBlockRefs',
  'linkActionRefs',
  'reportRefs',
  'requestActionRefs',
  'requests',
  'sheetNameRefs',
  'shortcutRefs',
  'websocketActionRefs',
];

test('createPageContext creates every ref array when only the page id and context are given', () => {
  const pageContext = createPageContext({ pageId: 'page1', context: {} });
  REF_ARRAYS.forEach((key) => {
    expect(Array.isArray(pageContext[key])).toBe(true);
    expect(pageContext[key]).toEqual([]);
  });
  expect(pageContext.pageId).toBe('page1');
  expect(pageContext.forbidRequests).toBe(false);
  expect(pageContext.blockIdPrefix).toBe(undefined);
  expect(typeof pageContext.blockIdCounter.increment).toBe('function');
  expect(typeof pageContext.checkDuplicateRequestId).toBe('function');
});

test('createPageContext threads shared ref arrays through by reference', () => {
  const linkActionRefs = [];
  const callApiActionRefs = [];
  const pageContext = createPageContext({
    pageId: 'page1',
    context: {},
    linkActionRefs,
    callApiActionRefs,
  });
  expect(pageContext.linkActionRefs).toBe(linkActionRefs);
  expect(pageContext.callApiActionRefs).toBe(callApiActionRefs);
});

test('createPageContext gives each call its own per-page arrays and counters', () => {
  const a = createPageContext({ pageId: 'a', context: {} });
  const b = createPageContext({ pageId: 'b', context: {} });
  expect(a.requests).not.toBe(b.requests);
  expect(a.sheetNameRefs).not.toBe(b.sheetNameRefs);
  expect(a.blockIdCounter).not.toBe(b.blockIdCounter);
});

test('createPageContext carries the runtime dynamic content options', () => {
  const typeCounters = { blocks: { increment: () => {} } };
  const pageContext = createPageContext({
    pageId: 'page1',
    context: {},
    blockIdPrefix: 'block:page1:section:0',
    forbidRequests: true,
    typeCounters,
  });
  expect(pageContext.blockIdPrefix).toBe('block:page1:section:0');
  expect(pageContext.forbidRequests).toBe(true);
  expect(pageContext.typeCounters).toBe(typeCounters);
});

test('createPageContext duplicate request check throws on a repeated id within the page', () => {
  const pageContext = createPageContext({ pageId: 'page1', context: {} });
  pageContext.checkDuplicateRequestId({ id: 'r1', pageId: 'page1', configKey: 'k1' });
  expect(() =>
    pageContext.checkDuplicateRequestId({ id: 'r1', pageId: 'page1', configKey: 'k2' })
  ).toThrow('Duplicate requestId "r1" on page "page1".');
});
