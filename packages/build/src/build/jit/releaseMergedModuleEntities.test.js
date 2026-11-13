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

import { expect, test } from 'vitest';

import releaseMergedModuleEntities from './releaseMergedModuleEntities.js';

test('releaseMergedModuleEntities removes the pages and endpoints of every module manifest', () => {
  const context = {
    modules: {
      contacts: {
        id: 'contacts',
        manifest: {
          name: 'Contacts',
          pages: [{ id: 'contacts/all', type: 'Box' }],
          api: [{ id: 'contacts/create', type: 'Api' }],
        },
      },
      deals: {
        id: 'deals',
        manifest: { name: 'Deals', pages: [{ id: 'deals/all', type: 'Box' }] },
      },
    },
  };

  releaseMergedModuleEntities({ context });

  expect(context.modules.contacts.manifest).toEqual({ name: 'Contacts' });
  expect(context.modules.deals.manifest).toEqual({ name: 'Deals' });
});

test('releaseMergedModuleEntities keeps the manifest parts page builds and the module docs read', () => {
  const manifest = {
    name: 'Contacts',
    description: 'People and companies.',
    vars: { title: { type: 'string', default: 'Contacts' } },
    exports: { pages: [{ id: 'all' }] },
    components: [{ id: 'card', component: { '~deferred': 'contacts:components.0.component' } }],
    menus: [{ id: 'default', links: [{ id: 'all', type: 'MenuLink', pageId: 'contacts/all' }] }],
    connections: [{ id: 'contacts/db', type: 'MongoDBCollection' }],
    auth: { public: ['all'] },
    pages: [{ id: 'contacts/all', type: 'Box' }],
    api: [{ id: 'contacts/create', type: 'Api' }],
  };
  const context = { modules: { contacts: { id: 'contacts', manifest } } };

  releaseMergedModuleEntities({ context });

  expect(Object.keys(context.modules.contacts.manifest)).toEqual([
    'name',
    'description',
    'vars',
    'exports',
    'components',
    'menus',
    'connections',
    'auth',
  ]);
});

test('releaseMergedModuleEntities leaves the merged page and endpoint objects as they are', () => {
  const page = { id: 'contacts/all', type: 'Box', blocks: [{ id: 'title', type: 'Title' }] };
  const endpoint = { id: 'contacts/create', type: 'Api', routine: [] };
  const components = { pages: [page], api: [endpoint] };
  const context = {
    modules: { contacts: { id: 'contacts', manifest: { pages: [page], api: [endpoint] } } },
  };

  releaseMergedModuleEntities({ context });

  expect(components.pages[0]).toBe(page);
  expect(components.pages[0].blocks).toEqual([{ id: 'title', type: 'Title' }]);
  expect(components.api[0]).toBe(endpoint);
});

test('releaseMergedModuleEntities does nothing for an app with no modules', () => {
  const context = { modules: Object.create(null) };

  releaseMergedModuleEntities({ context });

  expect(Object.keys(context.modules)).toEqual([]);
});
