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

import createPageManager from './createPageManager.js';

function createFakePage() {
  return {
    evaluate: jest.fn(async () => 'ticket'),
    goto: jest.fn(async () => {}),
    waitForFunction: jest.fn(async () => {}),
    waitForURL: jest.fn(async () => {}),
  };
}

const manifest = {
  basePath: '/app',
  pages: { ticket: {} },
  paths: { ticket: 'tickets/{space}/{ticket_id}' },
};
const target = { pageId: 'ticket', pathParams: { space: 'support', ticket_id: '1234' } };

test('ldf.goto opens a target under the basePath and path pattern the manifest records', async () => {
  const page = createFakePage();
  const ldf = createPageManager({ page, manifest });
  await ldf.goto(target);
  expect(page.goto).toHaveBeenCalledWith('/app/tickets/support/1234');
  expect(ldf.pageId).toBe('ticket');
});

test('ldf.waitForPage waits for the target URL under the basePath', async () => {
  const page = createFakePage();
  const ldf = createPageManager({ page, manifest });
  await ldf.waitForPage(target);
  expect(page.waitForURL).toHaveBeenCalledWith('/app/tickets/support/1234', {
    waitUntil: 'domcontentloaded',
  });
});

test('ldf.goto leaves a string target as written', async () => {
  const page = createFakePage();
  const ldf = createPageManager({ page, manifest });
  await ldf.goto('/app/tickets/support/1234');
  expect(page.goto).toHaveBeenCalledWith('/app/tickets/support/1234');
});
