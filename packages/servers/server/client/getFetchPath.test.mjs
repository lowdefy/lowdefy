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

import getFetchPath from './getFetchPath.js';

const rootConfig = {
  home: { pageId: 'ticket', pathParams: { ticket_id: '7' } },
  pagePaths: { ticket: 'tickets/{ticket_id}' },
};

test('getFetchPath fetches the path of a navigation as it is', () => {
  expect(getFetchPath({ path: 'tickets/12', rootConfig })).toBe('tickets/12');
});

test('getFetchPath fetches the home page path at the app root', () => {
  expect(getFetchPath({ path: '', rootConfig })).toBe('tickets/7');
});
