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

import createNetworkCounter from './createNetworkCounter.js';
import matchExercisedPages from './matchExercisedPages.js';
import matchJourneyRoute from './matchJourneyRoute.js';
import mergeNetworkSnapshots from './mergeNetworkSnapshots.js';
import nextJourneySequence from './nextJourneySequence.js';

const origin = 'http://localhost:3111';

test.each([
  ['GET', '/api/root', { route: 'root' }],
  ['GET', '/api/page/tickets', { route: 'page', path: 'tickets' }],
  ['GET', '/api/page/admin/users', { route: 'page', path: 'admin/users' }],
  ['GET', '/api/page/tickets/s/2', { route: 'page', path: 'tickets/s/2' }],
  ['GET', '/api/page/', null],
  [
    'POST',
    '/api/request/tickets/assign',
    { route: 'request', pageId: 'tickets', requestId: 'assign' },
  ],
  ['POST', '/api/endpoints/notify', { route: 'endpoint', endpointId: 'notify' }],
  ['GET', '/api/endpoints/reports/daily', { route: 'endpoint', endpointId: 'reports/daily' }],
  ['POST', '/api/root', null],
  ['GET', '/api/request/tickets/assign', null],
  ['POST', '/api/request/tickets', null],
  ['GET', '/api/reload', null],
  ['GET', '/tickets', null],
])('matchJourneyRoute matches %s %s', (method, pathname, expected) => {
  expect(matchJourneyRoute({ url: `${origin}${pathname}`, method, origin })).toEqual(expected);
});

test('matchJourneyRoute honours the basePath and ignores paths outside it', () => {
  expect(
    matchJourneyRoute({
      url: `${origin}/app/api/page/home`,
      method: 'GET',
      origin,
      basePath: '/app',
    })
  ).toEqual({ route: 'page', path: 'home' });
  expect(
    matchJourneyRoute({
      url: `${origin}/app/api/page/tickets/s/2?tab=notes`,
      method: 'GET',
      origin,
      basePath: '/app',
    })
  ).toEqual({ route: 'page', path: 'tickets/s/2' });
  expect(
    matchJourneyRoute({ url: `${origin}/api/page/home`, method: 'GET', origin, basePath: '/app' })
  ).toBeNull();
});

test('matchJourneyRoute ignores requests to another origin', () => {
  expect(
    matchJourneyRoute({ url: 'http://elsewhere.test/api/page/home', method: 'GET', origin })
  ).toBeNull();
});

function request(method, pathname) {
  return { method: () => method, url: () => `${origin}${pathname}` };
}

test('createNetworkCounter counts request calls per page and endpoint calls', () => {
  const counter = createNetworkCounter({ origin, basePath: '' });
  counter.record(request('GET', '/api/root'));
  counter.record(request('GET', '/api/page/tickets'));
  counter.record(request('GET', '/api/page/tickets/s/2'));
  counter.record(request('POST', '/api/request/tickets/save'));
  counter.record(request('POST', '/api/request/tickets/save'));
  counter.record(request('POST', '/api/request/ticket/save'));
  counter.record(request('POST', '/api/endpoints/notify'));
  expect(counter.countCalls({ request: 'save', pageId: 'tickets' })).toEqual(2);
  expect(counter.countCalls({ request: 'save', pageId: 'ticket' })).toEqual(1);
  expect(counter.countCalls({ request: 'save', pageId: 'other' })).toEqual(0);
  expect(counter.countCalls({ endpoint: 'notify' })).toEqual(1);
  expect(counter.countCalls({ endpoint: 'other' })).toEqual(0);
  expect(counter.snapshot()).toEqual({
    pagePaths: ['tickets', 'tickets/s/2'],
    appEvents: true,
    requests: [
      { pageId: 'tickets', requestId: 'save', calls: 2 },
      { pageId: 'ticket', requestId: 'save', calls: 1 },
    ],
    endpoints: [{ endpointId: 'notify', calls: 1 }],
  });
});

test('mergeNetworkSnapshots sums calls across actors and sorts the result', () => {
  expect(
    mergeNetworkSnapshots({
      snapshots: [
        {
          pagePaths: ['tickets/s/2'],
          appEvents: true,
          requests: [{ pageId: 'tickets', requestId: 'save', calls: 1 }],
          endpoints: [{ endpointId: 'notify', calls: 1 }],
        },
        {
          pagePaths: ['home', 'tickets/s/2', 'tickets/s/5'],
          appEvents: false,
          requests: [
            { pageId: 'tickets', requestId: 'save', calls: 2 },
            { pageId: 'home', requestId: 'load', calls: 1 },
          ],
          endpoints: [{ endpointId: 'notify', calls: 3 }],
        },
      ],
    })
  ).toEqual({
    pagePaths: ['home', 'tickets/s/2', 'tickets/s/5'],
    appEvents: true,
    requests: [
      { pageId: 'home', requestId: 'load', calls: 1 },
      { pageId: 'tickets', requestId: 'save', calls: 3 },
    ],
    endpoints: [{ endpointId: 'notify', calls: 4 }],
  });
});

const routes = [
  { pageId: 'home', path: 'home' },
  { pageId: 'ticket', path: 'tickets/{space}/{ticket_id}' },
  { pageId: 'admin/users', path: 'people' },
];

test('matchExercisedPages names a patterned page once for all of its instances', () => {
  expect(
    matchExercisedPages({ routes, pagePaths: ['tickets/s/2', 'tickets/s/5', 'home'] })
  ).toEqual(['home', 'ticket']);
});

test('matchExercisedPages names a page with a fixed path by its id', () => {
  expect(matchExercisedPages({ routes, pagePaths: ['people'] })).toEqual(['admin/users']);
});

test('matchExercisedPages drops a path no page answers', () => {
  expect(matchExercisedPages({ routes, pagePaths: ['admin/users', 'missing'] })).toEqual([]);
});

test('a journey under a basePath reports page ids for the page paths it loaded', () => {
  const counter = createNetworkCounter({ origin, basePath: '/app' });
  counter.record(request('GET', '/app/api/page/tickets/s/2'));
  counter.record(request('GET', '/app/api/page/people'));
  counter.record(request('GET', '/api/page/home'));
  expect(
    matchExercisedPages({
      routes,
      pagePaths: mergeNetworkSnapshots({ snapshots: [counter.snapshot()] }).pagePaths,
    })
  ).toEqual(['admin/users', 'ticket']);
});

test('the network counter tells a request call made after a point from one made before it', () => {
  const counter = createNetworkCounter({ origin, basePath: '' });
  const call = { url: () => `${origin}/api/request/form/save`, method: () => 'POST' };
  const beforeCall = nextJourneySequence();
  counter.record(call);
  const afterCall = nextJourneySequence();
  expect(counter.calledSince({ request: 'save', pageId: 'form', since: beforeCall })).toBe(true);
  expect(counter.calledSince({ request: 'save', pageId: 'form', since: afterCall })).toBe(false);
  expect(counter.calledSince({ request: 'load', pageId: 'form', since: 0 })).toBe(false);
});
