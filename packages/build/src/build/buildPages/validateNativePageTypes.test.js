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

import validateNativePageTypes from './validateNativePageTypes.js';
import createCounter from '../../utils/createCounter.js';
import testContext from '../../test-utils/testContext.js';

function createContext() {
  const context = testContext();
  context.errors = [];
  context.typesMapMobile.blocks = {
    Box: { package: '@lowdefy/blocks-native' },
    Title: { package: '@lowdefy/blocks-native' },
    TextInput: { package: '@lowdefy/blocks-native' },
  };
  context.typesMapMobile.actions = { SetState: { package: '@lowdefy/actions-core' } };
  return context;
}

function createPage({ target, blocks }) {
  return {
    pageId: 'jobs',
    blockId: 'jobs',
    type: 'Box',
    target,
    slots: { content: { blocks } },
  };
}

function createPageCounters(actions = []) {
  const pageCounters = { actions: createCounter(), blocks: createCounter() };
  actions.forEach((action) => pageCounters.actions.increment(action, 'k1'));
  return pageCounters;
}

test('validateNativePageTypes accepts a page whose types all have native versions', () => {
  const context = createContext();
  const page = createPage({
    target: 'mobile',
    blocks: [{ blockId: 'title', type: 'Title' }],
  });
  validateNativePageTypes({ page, pageCounters: createPageCounters(['SetState']), context });
  expect(context.errors).toEqual([]);
});

test('validateNativePageTypes reports a nested block with no native version', () => {
  const context = createContext();
  const page = createPage({
    target: 'mobile',
    blocks: [
      {
        blockId: 'card',
        type: 'Box',
        slots: { content: { blocks: [{ blockId: 'grid', type: 'AgGridAlpine', '~k': 'k2' }] } },
      },
    ],
  });
  validateNativePageTypes({ page, pageCounters: createPageCounters(), context });
  expect(context.errors.map((error) => error.message)).toEqual([
    'Block type "AgGridAlpine" on block "grid" on page "jobs" has no native version, so a mobile shell cannot render it. Use "List" with "ListItem" on mobile.',
  ]);
  expect(context.errors[0].configKey).toEqual('k2');
});

test('validateNativePageTypes suggests List for Table', () => {
  const context = createContext();
  const page = createPage({ target: 'mobile', blocks: [{ blockId: 'rows', type: 'Table' }] });
  validateNativePageTypes({ page, pageCounters: createPageCounters(), context });
  expect(context.errors[0].message).toContain('Use "List" with "ListItem" on mobile.');
});

test('validateNativePageTypes reports an action with no native version', () => {
  const context = createContext();
  const page = createPage({ target: 'mobile', blocks: [] });
  validateNativePageTypes({ page, pageCounters: createPageCounters(['PdfMake']), context });
  expect(context.errors.map((error) => error.message)).toEqual([
    'Action type "PdfMake" on page "jobs" has no native version, so a mobile shell cannot run it.',
  ]);
  expect(context.errors[0].configKey).toEqual('k1');
});

test('validateNativePageTypes explains the shared page rule on a shared page', () => {
  const context = createContext();
  const page = createPage({ target: 'both', blocks: [{ blockId: 'chart', type: 'EChart' }] });
  validateNativePageTypes({ page, pageCounters: createPageCounters(), context });
  expect(context.errors[0].message).toEqual(
    'Block type "EChart" on block "chart" on page "jobs" has no native version, so a mobile shell cannot render it. The page is in both "pages" and "mobile.pages", so each type it uses must exist on web and on mobile.'
  );
});

test('validateNativePageTypes reports a shared block type whose category or value type differs', () => {
  const context = createContext();
  context.blockMetas = {
    Box: { category: 'container' },
    TextInput: { category: 'input', valueType: 'string' },
  };
  context.blockMetasMobile = {
    Box: { category: 'container' },
    TextInput: { category: 'input', valueType: 'number' },
  };
  const page = createPage({ target: 'both', blocks: [{ blockId: 'name', type: 'TextInput' }] });
  validateNativePageTypes({ page, pageCounters: createPageCounters(), context });
  expect(context.errors.map((error) => error.message)).toEqual([
    'Block type "TextInput" on block "name" on shared page "jobs" differs between web and mobile: web is category "input" with value type "string", mobile is category "input" with value type "number".',
  ]);
});

test('validateNativePageTypes does not compare metas on a mobile-only page', () => {
  const context = createContext();
  context.blockMetas = { TextInput: { category: 'input', valueType: 'string' } };
  context.blockMetasMobile = { TextInput: { category: 'display' } };
  const page = createPage({ target: 'mobile', blocks: [{ blockId: 'name', type: 'TextInput' }] });
  validateNativePageTypes({ page, pageCounters: createPageCounters(), context });
  expect(context.errors).toEqual([]);
});
