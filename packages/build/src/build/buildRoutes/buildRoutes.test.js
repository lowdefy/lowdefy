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

import buildRoutes from './buildRoutes.js';
import testContext from '../../test-utils/testContext.js';

function run(components) {
  const context = testContext();
  context.errors = [];
  buildRoutes({ components, context });
  return { routes: context.routes, errors: context.errors.map((error) => error.message) };
}

function routePaths(routes) {
  return routes.map(({ pageId, path }) => ({ pageId, path }));
}

test('buildRoutes gives a page with a path its pattern and a page without one its id', () => {
  const { routes, errors } = run({
    pages: [
      { id: 'ticket', type: 'Box', path: 'tickets/{space}/{ticket_id}' },
      { id: 'admin/users', type: 'Box' },
    ],
  });
  expect(errors).toEqual([]);
  expect(routePaths(routes)).toEqual([
    { pageId: 'ticket', path: 'tickets/{space}/{ticket_id}' },
    { pageId: 'admin/users', path: 'admin/users' },
  ]);
  expect(routes[0].segments).toEqual([
    { fixed: 'tickets' },
    { name: 'space' },
    { name: 'ticket_id' },
  ]);
  expect(routes[1].segments).toEqual([{ fixed: 'admin' }, { fixed: 'users' }]);
});

test('buildRoutes accepts a path without placeholders as given', () => {
  const { routes, errors } = run({
    pages: [{ id: 'about', type: 'Box', path: 'company/about-us' }],
  });
  expect(errors).toEqual([]);
  expect(routePaths(routes)).toEqual([{ pageId: 'about', path: 'company/about-us' }]);
});

test('buildRoutes refuses a path that is not a string with a message to quote it', () => {
  const { routes, errors } = run({
    pages: [{ id: 'post', type: 'Box', path: { slug: null } }],
  });
  expect(errors).toEqual([
    `Page "post" path should be a string. A path that starts with a placeholder must be quoted in YAML, like path: '{space}/tickets/{ticket_id}'.`,
  ]);
  expect(routes).toEqual([]);
});

test('buildRoutes refuses a pattern the path parser refuses, naming the page', () => {
  const { errors } = run({
    pages: [{ id: 'ticket', type: 'Box', path: 'tickets/{...rest}' }],
  });
  expect(errors).toEqual([
    'Page "ticket": Page path "tickets/{...rest}" has a catch-all placeholder "{...rest}". Catch-all placeholders are not supported.',
  ]);
});

test('buildRoutes refuses paths that tie, comparing fixed segments ignoring case', () => {
  const { errors } = run({
    pages: [
      { id: 'ticket', type: 'Box', path: 'Tickets/{id}' },
      { id: 'ticket-copy', type: 'Box', path: 'tickets/{ticket_id}' },
    ],
  });
  expect(errors).toHaveLength(1);
  expect(errors[0]).toMatch(
    'Pages "ticket" and "ticket-copy" match the same URLs, with paths "Tickets/{id}" and "tickets/{ticket_id}".'
  );
});

test('buildRoutes refuses a path that ties with another page id', () => {
  const { errors } = run({
    pages: [
      { id: 'tickets/new', type: 'Box' },
      { id: 'new-ticket', type: 'Box', path: 'tickets/new' },
    ],
  });
  expect(errors).toHaveLength(1);
  expect(errors[0]).toMatch('Pages "tickets/new" and "new-ticket" match the same URLs');
});

test('buildRoutes accepts overlapping paths that rank apart', () => {
  const { errors } = run({
    pages: [
      { id: 'space-tickets', type: 'Box', path: '{space}/tickets' },
      { id: 'admin-section', type: 'Box', path: 'admin/{section}' },
      { id: 'admin/tickets', type: 'Box' },
      { id: 'ticket', type: 'Box', path: '{space}/tickets/{ticket_id}' },
    ],
  });
  expect(errors).toEqual([]);
});

test('buildRoutes leaves two pages with the same id to the duplicate page id check', () => {
  const { errors } = run({
    pages: [
      { id: 'home', type: 'Box' },
      { id: 'Home', type: 'Box' },
    ],
  });
  expect(errors).toEqual([]);
});

test('buildRoutes refuses a path on the 404 page', () => {
  const { errors } = run({
    pages: [{ id: '404', type: 'Box', path: 'not-found' }],
  });
  expect(errors).toEqual([
    'Page "404" cannot have a path. Every URL that matches no page is redirected to "/404".',
  ]);
});

test('buildRoutes refuses placeholders on the config.homePageId page', () => {
  const { errors } = run({
    config: { homePageId: 'dashboard' },
    pages: [{ id: 'dashboard', type: 'Box', path: '{space}/dashboard' }],
  });
  expect(errors).toEqual([
    'Page "dashboard" is the home page ("config.homePageId"), so its path "{space}/dashboard" cannot have placeholders. The home page is served at "/", with no values to fill them.',
  ]);
});

test('buildRoutes accepts a fixed path on the config.homePageId page', () => {
  const { errors } = run({
    config: { homePageId: 'dashboard' },
    pages: [{ id: 'dashboard', type: 'Box', path: 'start' }],
  });
  expect(errors).toEqual([]);
});

test('buildRoutes skips a page without a string id, which buildPage refuses', () => {
  const { routes, errors } = run({
    pages: [{ type: 'Box' }, { id: 'home', type: 'Box' }],
  });
  expect(errors).toEqual([]);
  expect(routePaths(routes)).toEqual([{ pageId: 'home', path: 'home' }]);
});

test.each(['foo/', '/foo', 'a//b'])(
  'buildRoutes refuses page id "%s" with an empty segment for a page without a path',
  (id) => {
    const { routes, errors } = run({ pages: [{ id, type: 'Box' }] });
    expect(errors).toEqual([
      `Page id "${id}" contains an empty segment. Page ids cannot start or end with "/" or contain "//".`,
    ]);
    expect(routes).toEqual([]);
  }
);

test.each(['a.b', '{slug}'])(
  'buildRoutes refuses page id "%s" with invalid characters for a page without a path',
  (id) => {
    const { routes, errors } = run({ pages: [{ id, type: 'Box' }] });
    expect(errors).toEqual([
      `Page id "${id}" contains invalid characters. IDs must only contain A-Z, a-z, 0-9, "-", "_", "/", and ":".`,
    ]);
    expect(routes).toEqual([]);
  }
);

test('buildRoutes accepts a nested page id for a page without a path', () => {
  const { routes, errors } = run({ pages: [{ id: 'a/b', type: 'Box' }] });
  expect(errors).toEqual([]);
  expect(routePaths(routes)).toEqual([{ pageId: 'a/b', path: 'a/b' }]);
});
