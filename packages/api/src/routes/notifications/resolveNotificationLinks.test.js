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

import resolveNotificationLinks from './resolveNotificationLinks.js';

const routes = [
  { pageId: 'users', path: 'admin/users', auth: { public: false } },
  { pageId: 'ticket', path: 'tickets/{space}/{ticket_id}', auth: { public: false } },
  { pageId: 'home', path: 'home', auth: { public: true } },
];

const ticketLink = {
  pageId: 'ticket',
  pathParams: { space: 'a b', ticket_id: '1' },
  urlQuery: { tab: 'notes' },
};

test('resolveNotificationLinks builds a patterned page link under basePath', () => {
  const resolved = resolveNotificationLinks({
    item: { links: { button: ticketLink } },
    serverUrl: 'https://myapp.com',
    basePath: '/app',
    routes,
  });
  expect(resolved.links.button).toBe('https://myapp.com/app/tickets/a%20b/1?tab=notes');
});

test('resolveNotificationLinks builds a fixed path page link at its path, not its id', () => {
  const resolved = resolveNotificationLinks({
    item: { links: { button: { pageId: 'users' } } },
    serverUrl: 'https://myapp.com',
    basePath: '',
    routes,
  });
  expect(resolved.links.button).toBe('https://myapp.com/admin/users');
});

test('resolveNotificationLinks builds a page missing from the route table at its id', () => {
  const resolved = resolveNotificationLinks({
    item: { links: { button: { pageId: 'unknown', urlQuery: { id: '1' } } } },
    serverUrl: 'https://myapp.com',
    basePath: '',
    routes,
  });
  expect(resolved.links.button).toBe('https://myapp.com/unknown?id=1');
});

test('resolveNotificationLinks throws for a link missing a path value', () => {
  expect(() =>
    resolveNotificationLinks({
      item: { links: { button: { pageId: 'ticket', pathParams: { space: 's' } } } },
      serverUrl: 'https://myapp.com',
      basePath: '',
      routes,
    })
  ).toThrow('Link to page "ticket" is missing a value for path placeholder "ticket_id".');
});

test('resolveNotificationLinks builds patterned links inside declared data key arrays', () => {
  const resolved = resolveNotificationLinks({
    item: { items: [{ title: 'One', link: ticketLink }] },
    dataKeys: ['items'],
    serverUrl: 'https://myapp.com',
    basePath: '',
    routes,
  });
  expect(resolved.items[0].link).toBe('https://myapp.com/tickets/a%20b/1?tab=notes');
});

test('resolveNotificationLinks routes through the landing page and keeps pathParams on the item', () => {
  const item = { links: { button: ticketLink } };
  const resolved = resolveNotificationLinks({
    item,
    serverUrl: 'https://myapp.com',
    basePath: '',
    landingPage: '/notifications/link',
    recordId: 'rec-1',
    routes,
  });
  expect(resolved.links.button).toBe(
    'https://myapp.com/notifications/link?_id=rec-1&option=links.button'
  );
  expect(item.links.button).toEqual(ticketLink);
});
