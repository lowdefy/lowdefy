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

import { jest } from '@jest/globals';

import validateApiHtmlLinks from './validateApiHtmlLinks.js';

function createContext() {
  return { handleWarning: jest.fn() };
}

test('validateApiHtmlLinks warns for a data-page-id in an endpoint that names no page', () => {
  const context = createContext();
  validateApiHtmlLinks({
    components: {
      api: [
        {
          '~k': 'e1',
          endpointId: 'log-event',
          routine: [{ ':return': '<a data-page-id="contact-detail">Jane</a> closed a task' }],
        },
      ],
      pages: [{ pageId: 'contact-details' }, { pageId: 'home' }],
    },
    context,
  });
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  const warning = context.handleWarning.mock.calls[0][0];
  expect(warning.message).toBe(
    'data-page-id="contact-detail" in endpoint "log-event" links to a page that does not exist. Did you mean "contact-details"?'
  );
  expect(warning.configKey).toBe('e1');
  expect(warning.prodError).toBeFalsy();
  expect(warning.checkSlug).toBe('link-refs');
});

test('validateApiHtmlLinks accepts links to existing pages and apps without endpoints', () => {
  const context = createContext();
  validateApiHtmlLinks({
    components: {
      api: [{ '~k': 'e1', endpointId: 'x', routine: '<a data-page-id="home">Home</a>' }],
      pages: [{ pageId: 'home' }],
    },
    context,
  });
  validateApiHtmlLinks({ components: { pages: [] }, context });
  expect(context.handleWarning).not.toHaveBeenCalled();
});
