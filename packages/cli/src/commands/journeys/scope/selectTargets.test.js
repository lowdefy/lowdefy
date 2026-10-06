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

import fs from 'fs';
import os from 'os';
import path from 'path';

import describeEmptyScope from './describeEmptyScope.js';
import diffBuilds from './diffBuilds.js';
import readBuildArtifacts from './readBuildArtifacts.js';
import selectTargets from './selectTargets.js';

let root;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-scope-diff-'));
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

// A build directory with the artifacts given (path → JSON value or string),
// plus the keyMap.json and refMap.json every build writes.
function writeBuild(name, files) {
  const directory = path.join(root, name);
  const all = {
    'keyMap.json': {},
    'refMap.json': {},
    'menus.json': [],
    'config.json': {},
    ...files,
  };
  Object.entries(all).forEach(([file, value]) => {
    const filePath = path.join(directory, file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, typeof value === 'string' ? value : JSON.stringify(value));
  });
  return readBuildArtifacts({ buildDirectory: directory });
}

function page({ pageId, blocks = [], events, auth = { public: true }, k = 'p' }) {
  return {
    id: `page:${pageId}`,
    type: 'Box',
    auth: { ...auth, '~k': `${k}a` },
    pageId,
    blockId: pageId,
    ...(events ? { events } : {}),
    slots: { content: { blocks: { '~arr': blocks, '~k': `${k}b` } } },
    '~k': k,
  };
}

function block({ blockId, type = 'Button', properties = {}, events, k = blockId, blocks }) {
  return {
    id: `block:x:${blockId}:0`,
    type,
    blockId,
    properties: { ...properties, '~k': `${k}p` },
    ...(events ? { events } : {}),
    ...(blocks ? { slots: { content: { blocks: { '~arr': blocks } } } } : {}),
    '~k': k,
  };
}

function callApi(endpointId) {
  return { onClick: { try: [{ id: 'call', type: 'CallAPI', params: { endpointId } }] } };
}

// An app with a tickets page (a request on tickets_db, a CallAPI to assign,
// which calls notify on mailer, and a feed subscription), a settings page and
// a home page. Each test changes one thing in the head.
function appFiles() {
  const tickets = page({
    pageId: 'tickets',
    blocks: [
      block({
        blockId: 'assign_button',
        properties: { title: 'Assign' },
        events: callApi('assign'),
      }),
    ],
  });
  tickets.subscriptions = [{ websocketId: 'feed' }];
  return {
    'pages/home.json': page({
      pageId: 'home',
      blocks: [block({ blockId: 'welcome', type: 'Html' })],
    }),
    'pages/tickets.json': tickets,
    'pages/settings.json': page({ pageId: 'settings', blocks: [block({ blockId: 'save' })] }),
    'pages/404.json': page({ pageId: '404' }),
    'pages/tickets/requests/get_tickets.json': {
      requestId: 'get_tickets',
      connectionId: 'tickets_db',
    },
    'pages/settings/requests/get_settings.json': {
      requestId: 'get_settings',
      connectionId: 'settings_db',
    },
    'api/assign.json': {
      endpointId: 'assign',
      routine: [
        { id: 'request:assign:update', connectionId: 'tickets_db' },
        { type: 'CallApi', properties: { endpointId: 'notify' } },
      ],
    },
    'api/notify.json': { endpointId: 'notify', routine: [{ connectionId: 'mailer' }] },
    'connections/tickets_db.json': {
      connectionId: 'tickets_db',
      properties: { collection: 'tickets' },
    },
    'connections/settings_db.json': {
      connectionId: 'settings_db',
      properties: { collection: 's' },
    },
    'connections/mailer.json': { connectionId: 'mailer', properties: { baseURL: 'https://a' } },
    'websockets/feed.json': { websocketId: 'feed', version: 1 },
    'events.json': {},
    'i18n.json': {},
    'dynamicPolicies.json': {},
    'menus.json': [
      { menuId: 'default', links: { '~arr': [{ id: 'm1', type: 'MenuLink', pageId: 'home' }] } },
    ],
  };
}

function targets({ change = () => {}, coverage = null } = {}) {
  const head = appFiles();
  change(head);
  const baseBuild = writeBuild('base', appFiles());
  const headBuild = writeBuild('head', head);
  return selectTargets({
    diff: diffBuilds({ baseBuild, headBuild }),
    baseBuild,
    headBuild,
    coverage,
  });
}

function reasons(result) {
  return Object.fromEntries(result.pages.map((target) => [target.pageId, target.reasons]));
}

test('selectTargets marks a page whose own artifact changed, with its changed blocks', () => {
  const result = targets({
    change: (head) => {
      head['pages/settings.json'] = page({
        pageId: 'settings',
        blocks: [block({ blockId: 'save', properties: { title: 'Save now' } })],
      });
    },
  });
  expect(reasons(result)).toEqual({ settings: ['page'] });
  expect(result.pages[0].blocks).toEqual([
    { blockId: 'save', type: 'Button', change: 'changed', label: 'Save now', source: null },
  ]);
  expect(result.pages[0].authChanged).toBe(false);
});

test('selectTargets marks the page of a changed, added or removed request', () => {
  const result = targets({
    change: (head) => {
      head['pages/tickets/requests/get_tickets.json'] = {
        requestId: 'get_tickets',
        connectionId: 'tickets_db',
        limit: 5,
      };
      delete head['pages/settings/requests/get_settings.json'];
    },
  });
  expect(reasons(result)).toEqual({
    settings: ['request:get_settings'],
    tickets: ['request:get_tickets'],
  });
});

test('selectTargets marks pages that call a changed endpoint, also through an endpoint that calls it', () => {
  const result = targets({
    change: (head) => {
      head['api/notify.json'] = {
        endpointId: 'notify',
        routine: [{ connectionId: 'mailer', retry: 2 }],
      };
    },
  });
  expect(reasons(result)).toEqual({ tickets: ['endpoint:notify'] });
});

test('selectTargets marks pages whose requests or endpoints use a changed connection', () => {
  const tickets = targets({
    change: (head) => {
      head['connections/mailer.json'] = {
        connectionId: 'mailer',
        properties: { baseURL: 'https://b' },
      };
    },
  });
  expect(reasons(tickets)).toEqual({ tickets: ['connection:mailer'] });
  const settings = targets({
    change: (head) => {
      head['connections/settings_db.json'] = {
        connectionId: 'settings_db',
        properties: { collection: 't' },
      };
    },
  });
  expect(reasons(settings)).toEqual({ settings: ['connection:settings_db'] });
});

test('selectTargets marks pages that subscribe to a changed websocket source', () => {
  const result = targets({
    change: (head) => {
      head['websockets/feed.json'] = { websocketId: 'feed', version: 2 };
    },
  });
  expect(reasons(result)).toEqual({ tickets: ['websocket:feed'] });
});

test.each([['events.json'], ['i18n.json'], ['dynamicPolicies.json']])(
  'selectTargets adds the top three entry pages for a changed %s',
  (artifact) => {
    const coverage = {
      production: {
        entryPoints: [
          { page: 'tickets', sessions: 40 },
          { page: 'gone', sessions: 30 },
          { page: 'settings', sessions: 20 },
          { page: 'home', sessions: 10 },
          { page: '404', sessions: 5 },
        ],
      },
    };
    const result = targets({
      coverage,
      change: (head) => {
        head[artifact] = { changed: true };
      },
    });
    expect(reasons(result)).toEqual({
      home: ['app-wide'],
      settings: ['app-wide'],
      tickets: ['app-wide'],
    });
    expect(result.appWide).toEqual([artifact]);
  }
);

test('selectTargets adds the home page for an app-wide change without coverage.json', () => {
  const result = targets({
    change: (head) => {
      head['events.json'] = { onInit: [{ id: 'track' }] };
    },
  });
  expect(reasons(result)).toEqual({ home: ['app-wide'] });
  const configured = targets({
    change: (head) => {
      head['events.json'] = { onInit: [{ id: 'track' }] };
      head['config.json'] = { homePageId: 'settings' };
    },
  });
  expect(reasons(configured)).toEqual({ settings: ['app-wide'] });
});

test('selectTargets marks the pages a changed module component resolves into', () => {
  // Modules resolve into pages during the build: a changed shared component
  // is a changed block on every page that uses it.
  const component = (title) =>
    block({ blockId: 'module_header', type: 'Header', properties: { title } });
  const result = targets({
    change: (head) => {
      head['pages/home.json'] = page({
        pageId: 'home',
        blocks: [block({ blockId: 'welcome', type: 'Html' }), component('v2')],
      });
      head['pages/settings.json'] = page({
        pageId: 'settings',
        blocks: [block({ blockId: 'save' }), component('v2')],
      });
    },
  });
  expect(reasons(result)).toEqual({ home: ['page'], settings: ['page'] });
});

test('selectTargets reports a removed page and does not list it', () => {
  const result = targets({
    change: (head) => {
      delete head['pages/settings.json'];
      delete head['pages/settings/requests/get_settings.json'];
    },
  });
  expect(result.removedPages).toEqual(['settings']);
  expect(reasons(result)).toEqual({});
});

test('selectTargets flags a page whose auth changed', () => {
  const result = targets({
    change: (head) => {
      head['pages/settings.json'] = page({
        pageId: 'settings',
        auth: { public: false, roles: ['admin'] },
        blocks: [block({ blockId: 'save' })],
      });
    },
  });
  expect(result.pages[0]).toMatchObject({ pageId: 'settings', authChanged: true });
});

test('selectTargets gives an empty scope for a notification-only change, listing it as not compared', () => {
  const result = targets({
    change: (head) => {
      head['notifications/welcome.json'] = { subject: 'Hello' };
    },
  });
  expect(result.pages).toEqual([]);
  expect(describeEmptyScope({ scope: result })).toEqual(
    'no change in the compared artifacts; changed but not compared: notifications/welcome.json; run without --base to list every page.'
  );
});

test('selectTargets targets every head page but 404 when the base did not build', () => {
  const headBuild = writeBuild('head', appFiles());
  const result = selectTargets({
    diff: null,
    baseBuild: null,
    headBuild,
    baseError: 'The config at the base does not build, so every page is a target.',
  });
  expect(reasons(result)).toEqual({
    home: ['base-not-built'],
    settings: ['base-not-built'],
    tickets: ['base-not-built'],
  });
  expect(result.warnings).toEqual([
    'The config at the base does not build, so every page is a target.',
  ]);
  expect(
    result.pages.find((target) => target.pageId === 'home').blocks.map((b) => b.change)
  ).toEqual(['added', 'added']);
});
