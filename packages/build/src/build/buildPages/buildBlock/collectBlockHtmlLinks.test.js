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

import collectBlockHtmlLinks from './collectBlockHtmlLinks.js';

test('collectBlockHtmlLinks collects data-page-id from the block config but not its children', () => {
  const linkActionRefs = [];
  collectBlockHtmlLinks(
    {
      '~k': 'k1',
      id: 'list',
      properties: { html: '<a data-page-id="contacts">Contacts</a>' },
      events: {
        onClick: [
          {
            id: 'msg',
            type: 'DisplayMessage',
            params: { content: '<a data-page-id="tasks">t</a>' },
          },
        ],
      },
      requests: [{ id: 'r', payload: { html: '<a data-page-id="report">r</a>' } }],
      slots: { content: { blocks: [{ properties: { html: '<a data-page-id="child">c</a>' } }] } },
    },
    { linkActionRefs, pageId: 'home' }
  );
  expect(linkActionRefs).toEqual([
    { configKey: 'k1', html: true, location: 'page "home"', pageId: 'contacts' },
    { configKey: 'k1', html: true, location: 'page "home"', pageId: 'tasks' },
    { configKey: 'k1', html: true, location: 'page "home"', pageId: 'report' },
  ]);
});

test('collectBlockHtmlLinks adds nothing for a block without data-page-id', () => {
  const linkActionRefs = [];
  collectBlockHtmlLinks(
    { '~k': 'k1', properties: { html: '<a href="/contacts">Contacts</a>' } },
    { linkActionRefs, pageId: 'home' }
  );
  expect(linkActionRefs).toEqual([]);
});
