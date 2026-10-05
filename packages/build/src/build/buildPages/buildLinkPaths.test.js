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

import buildPages from '../full/buildPages.js';
import buildRoutes from '../buildRoutes/buildRoutes.js';
import testContext from '../../test-utils/testContext.js';

const ticketPage = {
  id: 'ticket',
  type: 'Box',
  auth: { public: true },
  path: 'tickets/{space}/{ticket_id}',
};
const usersPage = { id: 'users', type: 'Box', auth: { public: true }, path: 'admin/users' };
const aboutPage = { id: 'about', type: 'Box', auth: { public: true } };

function linkAction(params) {
  return { id: 'go', type: 'Link', params };
}

function homeWith(block) {
  return { id: 'home', type: 'Box', auth: { public: true }, blocks: [block] };
}

// buildPage changes the pages it builds, so each run builds copies.
function run(pages) {
  const context = testContext();
  context.errors = [];
  const components = { pages: structuredClone(pages) };
  buildRoutes({ components, context });
  buildPages({ components, context });
  return {
    home: components.pages.find((page) => page.pageId === 'home'),
    errors: context.errors.map((error) => error.message),
  };
}

test('buildLinkPaths gives a page the paths of the pages its Link actions target', () => {
  const { home, errors } = run([
    homeWith({
      id: 'button',
      type: 'Button',
      events: {
        onClick: [
          linkAction({ pageId: 'ticket', pathParams: { space: 's', ticket_id: { _state: 'id' } } }),
          { id: 'users', type: 'Link', params: 'users' },
          { id: 'about', type: 'Link', params: 'about' },
        ],
      },
    }),
    ticketPage,
    usersPage,
    aboutPage,
  ]);
  expect(errors).toEqual([]);
  expect(home.linkPaths).toEqual({
    ticket: 'tickets/{space}/{ticket_id}',
    users: 'admin/users',
  });
});

test('buildLinkPaths gives a page linking only to pages without a path empty linkPaths', () => {
  const { home, errors } = run([
    homeWith({ id: 'b', type: 'Button', events: { onClick: [linkAction('about')] } }),
    aboutPage,
  ]);
  expect(errors).toEqual([]);
  expect(home.linkPaths).toEqual({});
});

test('buildLinkPaths refuses a static Link that leaves a placeholder without a value', () => {
  const { errors } = run([
    homeWith({
      id: 'b',
      type: 'Button',
      events: { onClick: [linkAction({ pageId: 'ticket', pathParams: { space: 's' } })] },
    }),
    ticketPage,
  ]);
  expect(errors).toEqual([
    'Link action "go" on page "home" links to page "ticket" without path params "ticket_id". Page "ticket" has path "tickets/{space}/{ticket_id}", so the link\'s pathParams must give every placeholder a value.',
  ]);
});

test('buildLinkPaths refuses a Link given only a page id to a page with placeholders', () => {
  const { errors } = run([
    homeWith({ id: 'b', type: 'Button', events: { onClick: [linkAction('ticket')] } }),
    ticketPage,
  ]);
  expect(errors).toHaveLength(1);
  expect(errors[0]).toMatch('without path params "space", "ticket_id"');
});

test('buildLinkPaths leaves pathParams an operator computes to the runtime', () => {
  const { home, errors } = run([
    homeWith({
      id: 'b',
      type: 'Button',
      events: {
        onClick: [linkAction({ pageId: 'ticket', pathParams: { _state: 'ticket_params' } })],
      },
    }),
    ticketPage,
  ]);
  expect(errors).toEqual([]);
  expect(home.linkPaths).toEqual({ ticket: 'tickets/{space}/{ticket_id}' });
});

test('buildLinkPaths refuses an HTML link without a value for every placeholder', () => {
  const { errors } = run([
    homeWith({
      id: 'html',
      type: 'Html',
      properties: {
        html: `<a data-page-id="ticket" data-path-params='{"space":"s"}'>t</a>`,
      },
    }),
    ticketPage,
  ]);
  expect(errors).toEqual([
    'data-page-id="ticket" on page "home" links without path params "ticket_id". Page "ticket" has path "tickets/{space}/{ticket_id}", so the link\'s data-path-params must give every placeholder a value, like data-path-params=\'{"ticket_id":"..."}\'.',
  ]);
});

test('buildLinkPaths adds the path of an HTML link that gives every placeholder a value', () => {
  const { home, errors } = run([
    homeWith({
      id: 'html',
      type: 'Html',
      properties: {
        html: `<a data-page-id="ticket" data-path-params='{"space":"s","ticket_id":"1"}'>t</a>`,
      },
    }),
    ticketPage,
  ]);
  expect(errors).toEqual([]);
  expect(home.linkPaths).toEqual({ ticket: 'tickets/{space}/{ticket_id}' });
});
