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

import createViewRouter from '@lowdefy/client/adapters/createViewRouter.js';
import createViewBridge from '@lowdefy/client/host/createViewBridge.js';
import createViewHost from '@lowdefy/client/host/createViewHost.js';
import createFakeViewLoader from '@lowdefy/client/test/createFakeViewLoader.js';
import { _location, _url_query } from '@lowdefy/operators-js/operators/client';
import { expect, test, vi } from 'vitest';

// The address operators on the host of a page shown as an MCP App view. The
// frame is on the sandbox origin, which names no page: the operators read the
// address of the view on the origin of the app from the host's globals.
function setup() {
  const view = createFakeViewLoader({ basePath: '/base', path: '/tickets/12?tab=notes&page=2' });
  const router = createViewRouter({ basePath: '/base', path: '/tickets/12?tab=notes&page=2' });
  const frameWindow = {
    document: {},
    fetch: vi.fn(),
    location: {
      hash: '#frame',
      host: 'sandbox.example.net',
      hostname: 'sandbox.example.net',
      href: 'https://sandbox.example.net/frame?sandbox=1#frame',
      origin: 'https://sandbox.example.net',
      pathname: '/frame',
      port: '',
      protocol: 'https:',
      search: '?sandbox=1',
    },
    WebSocket: function WebSocket() {},
  };
  const host = createViewHost({ bridge: createViewBridge({ view }), router, window: frameWindow });
  function location(params) {
    return _location({
      basePath: '/base',
      globals: host.globals,
      home: { pageId: 'home' },
      location: 'block.properties.title',
      pageId: 'ticket',
      params,
    });
  }
  function urlQuery(params) {
    return _url_query({ globals: host.globals, location: 'block.properties.title', params });
  }
  return { location, router, urlQuery };
}

test('_location returns the origin of the app and the path of the view on first load', () => {
  const { location } = setup();
  expect(location('origin')).toBe('https://app.example.com');
  expect(location('host')).toBe('app.example.com');
  expect(location('hostname')).toBe('app.example.com');
  expect(location('protocol')).toBe('https:');
  expect(location('port')).toBe('');
  expect(location('pathname')).toBe('/base/tickets/12');
  expect(location('search')).toBe('?tab=notes&page=2');
  expect(location('href')).toBe('https://app.example.com/base/tickets/12?tab=notes&page=2');
  expect(location('hash')).toBe('');
  expect(location('basePath')).toBe('/base');
  expect(location('pageId')).toBe('ticket');
  expect(location('homePageId')).toBe('home');
});

test('_location returns the path of the view after an in-view navigation', () => {
  const { location, router } = setup();
  router.push({ pathname: '/tickets/13', query: { tab: 'files' } });
  expect(location('origin')).toBe('https://app.example.com');
  expect(location('pathname')).toBe('/base/tickets/13');
  expect(location('search')).toBe('?tab=files');
  expect(location('href')).toBe('https://app.example.com/base/tickets/13?tab=files');
  router.back();
  expect(location('pathname')).toBe('/base/tickets/12');
});

test('_url_query returns the query of the view on first load', () => {
  const { urlQuery } = setup();
  expect(urlQuery(true)).toEqual({ tab: 'notes', page: 2 });
  expect(urlQuery('tab')).toBe('notes');
  expect(urlQuery('sandbox')).toBe(null);
});

test('_url_query returns the query of the view after an in-view navigation', () => {
  const { router, urlQuery } = setup();
  router.push({ pathname: '/tickets/13', query: { tab: 'files' } });
  expect(urlQuery(true)).toEqual({ tab: 'files' });
  router.replace({ pathname: '/tickets/13' });
  expect(urlQuery(true)).toEqual({});
});
