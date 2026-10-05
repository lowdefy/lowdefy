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

import { createPageUrl } from './navigation.js';

test('createPageUrl returns a string target unchanged', () => {
  expect(createPageUrl('/items?a=1')).toBe('/items?a=1');
});

test('createPageUrl builds a page without a pattern from its id', () => {
  expect(createPageUrl({ pageId: 'items' })).toBe('/items');
});

test('createPageUrl fills the placeholders and adds the query', () => {
  expect(
    createPageUrl({
      pageId: 'ticket',
      path: 'tickets/{space}/{ticket_id}',
      pathParams: { space: 's', ticket_id: 'a b' },
      urlQuery: { tab: 'a' },
    })
  ).toBe('/tickets/s/a%20b?tab=a');
});

test('createPageUrl throws for a missing placeholder value', () => {
  expect(() =>
    createPageUrl({
      pageId: 'ticket',
      path: 'tickets/{space}/{ticket_id}',
      pathParams: { space: 's' },
    })
  ).toThrow('missing a value for path placeholder "ticket_id"');
});
