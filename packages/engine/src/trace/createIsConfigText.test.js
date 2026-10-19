/**
 * @jest-environment jsdom
 */
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

import { pageInstanceKey } from '@lowdefy/helpers';

import getTrace from './getTrace.js';

function ordersPageConfig() {
  return {
    id: 'page:orders',
    pageId: 'orders',
    type: 'PageHeaderMenu',
    blocks: [
      { id: 'block:orders:save', blockId: 'save', type: 'Button', properties: { title: 'Assign' } },
      {
        id: 'block:orders:tabs',
        blockId: 'tabs',
        type: 'Tabs',
        properties: { tabs: [{ key: 'open', title: 'Open orders' }] },
      },
      {
        id: 'block:orders:grid',
        blockId: 'grid',
        type: 'AgGridAlpine',
        properties: {
          columnDefs: [{ field: 'name', headerName: 'Customer name' }],
          rowData: [{ name: 'Literal row', nested: { deeper: [{ label: 'Deep literal' }] } }],
          pageSize: 42,
        },
      },
      {
        id: 'block:orders:dynamic',
        blockId: 'dynamic',
        type: 'Dynamic',
        properties: { endpointId: 'content', fallback: 'Only in dynamic' },
        blocks: [{ blockId: 'inner', type: 'Button', properties: { title: 'Shared label' } }],
      },
      {
        id: 'block:orders:shared',
        blockId: 'shared',
        type: 'Button',
        properties: { title: 'Shared label' },
      },
    ],
  };
}

function createLowdefy({ pageConfig = ordersPageConfig(), pageId = 'orders' } = {}) {
  const instanceKey = pageInstanceKey({ pageId });
  return {
    basePath: '',
    home: {},
    contexts: {
      [instanceKey]: { pageId, _internal: { pageConfig } },
    },
    menus: [{ menuId: 'default', links: [{ id: 'link', properties: { title: 'Menu orders' } }] }],
    i18n: {
      active: 'en-US',
      messages: {
        'en-US': { 'app.greeting': 'Hello there' },
        'de-DE': { 'app.greeting': 'Hallo' },
      },
    },
  };
}

beforeEach(() => {
  window.history.replaceState({}, '', '/orders');
  window.__lowdefy_antd_locale = {
    Modal: { okText: 'OK', cancelText: 'Cancel' },
    Pagination: { jump_to: 'Go to page' },
  };
});

afterEach(() => {
  window.history.replaceState({}, '', '/');
  delete window.__lowdefy_antd_locale;
});

test('isConfigText is true for literal block titles, tab labels, column headers and deep rowData strings', () => {
  const { isConfigText } = getTrace(createLowdefy());
  expect(isConfigText({ text: 'Assign', pageId: 'orders' })).toBe(true);
  expect(isConfigText({ text: 'Open orders', pageId: 'orders' })).toBe(true);
  expect(isConfigText({ text: 'Customer name', pageId: 'orders' })).toBe(true);
  expect(isConfigText({ text: 'Deep literal', pageId: 'orders' })).toBe(true);
});

test('isConfigText is false for text that is not in config', () => {
  const { isConfigText } = getTrace(createLowdefy());
  expect(isConfigText({ text: 'Jane Customer', pageId: 'orders' })).toBe(false);
});

test('isConfigText is false for a number leaf shown as text', () => {
  const { isConfigText } = getTrace(createLowdefy());
  expect(isConfigText({ text: '42', pageId: 'orders' })).toBe(false);
});

test('isConfigText normalises whitespace before matching', () => {
  const { isConfigText } = getTrace(createLowdefy());
  expect(isConfigText({ text: '  Assign\n  ', pageId: 'orders' })).toBe(true);
  expect(isConfigText({ text: 'Customer\n   name', pageId: 'orders' })).toBe(true);
});

test('isConfigText is false for a non-string or empty text', () => {
  const { isConfigText } = getTrace(createLowdefy());
  expect(isConfigText({ text: null, pageId: 'orders' })).toBe(false);
  expect(isConfigText({ text: undefined, pageId: 'orders' })).toBe(false);
  expect(isConfigText({ text: 42, pageId: 'orders' })).toBe(false);
  expect(isConfigText({ text: '   ', pageId: 'orders' })).toBe(false);
});

test('isConfigText skips the subtree of a Dynamic block but keeps the same string elsewhere', () => {
  const { isConfigText } = getTrace(createLowdefy());
  expect(isConfigText({ text: 'Only in dynamic', pageId: 'orders' })).toBe(false);
  expect(isConfigText({ text: 'Shared label', pageId: 'orders' })).toBe(true);
});

test('isConfigText skips build marker values', () => {
  const pageConfig = ordersPageConfig();
  pageConfig.blocks[0]['~k'] = 'marker-key';
  const { isConfigText } = getTrace(createLowdefy({ pageConfig }));
  expect(isConfigText({ text: 'marker-key', pageId: 'orders' })).toBe(false);
});

test('isConfigText is true for menus, i18n messages, built-in messages and the antd locale with no page match', () => {
  const { isConfigText } = getTrace(createLowdefy());
  expect(isConfigText({ text: 'Menu orders', pageId: null })).toBe(true);
  expect(isConfigText({ text: 'Hello there', pageId: null })).toBe(true);
  expect(isConfigText({ text: 'Hallo', pageId: null })).toBe(true);
  expect(isConfigText({ text: 'Request error', pageId: null })).toBe(true);
  expect(isConfigText({ text: 'OK', pageId: null })).toBe(true);
  expect(isConfigText({ text: 'Cancel', pageId: 'unknown' })).toBe(true);
  expect(isConfigText({ text: 'Go to page', pageId: 'unknown' })).toBe(true);
  expect(isConfigText({ text: 'Assign', pageId: null })).toBe(false);
});

test('isConfigText does not use the config of another page', () => {
  const lowdefy = createLowdefy();
  lowdefy.contexts[pageInstanceKey({ pageId: 'customers' })] = {
    pageId: 'customers',
    _internal: { pageConfig: { blocks: [{ properties: { title: 'Customers only' } }] } },
  };
  const { isConfigText } = getTrace(lowdefy);
  expect(isConfigText({ text: 'Customers only', pageId: 'orders' })).toBe(false);
  expect(isConfigText({ text: 'Customers only', pageId: 'customers' })).toBe(false);
  expect(isConfigText({ text: 'Assign', pageId: 'customers' })).toBe(false);
});

test('isConfigText uses a new antd locale object once it replaces the old one', () => {
  const { isConfigText } = getTrace(createLowdefy());
  expect(isConfigText({ text: 'Go to page', pageId: 'orders' })).toBe(true);
  window.__lowdefy_antd_locale = { Pagination: { jump_to: 'Gehe zu' } };
  expect(isConfigText({ text: 'Gehe zu', pageId: 'orders' })).toBe(true);
  expect(isConfigText({ text: 'Go to page', pageId: 'orders' })).toBe(false);
});

test('isConfigText uses new i18n messages once lowdefy.i18n is replaced', () => {
  const lowdefy = createLowdefy();
  const { isConfigText } = getTrace(lowdefy);
  expect(isConfigText({ text: 'Hello there', pageId: 'orders' })).toBe(true);
  lowdefy.i18n = { active: 'en-US', messages: { 'en-US': { 'app.greeting': 'Welcome back' } } };
  expect(isConfigText({ text: 'Welcome back', pageId: 'orders' })).toBe(true);
  expect(isConfigText({ text: 'Hello there', pageId: 'orders' })).toBe(false);
});

test('isConfigText uses a re-resolved page config once the context holds a new object', () => {
  const lowdefy = createLowdefy();
  const { isConfigText } = getTrace(lowdefy);
  expect(isConfigText({ text: 'Assign', pageId: 'orders' })).toBe(true);
  lowdefy.contexts[pageInstanceKey({ pageId: 'orders' })]._internal.pageConfig = {
    blocks: [{ properties: { title: 'Reassign' } }],
  };
  expect(isConfigText({ text: 'Reassign', pageId: 'orders' })).toBe(true);
  expect(isConfigText({ text: 'Assign', pageId: 'orders' })).toBe(false);
});

test('isConfigText walks each source once for repeated calls with the same sources', () => {
  const pageConfig = ordersPageConfig();
  let reads = 0;
  Object.defineProperty(pageConfig.blocks[0], 'properties', {
    enumerable: true,
    get() {
      reads += 1;
      return { title: 'Assign' };
    },
  });
  const { isConfigText } = getTrace(createLowdefy({ pageConfig }));
  expect(isConfigText({ text: 'Assign', pageId: 'orders' })).toBe(true);
  expect(isConfigText({ text: 'Nothing', pageId: 'orders' })).toBe(false);
  expect(isConfigText({ text: 'Open orders', pageId: 'orders' })).toBe(true);
  expect(reads).toBe(1);
});
