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

import { getState, goto, setState, waitForPage } from '@lowdefy/e2e-utils/runtime';

import { fixtureTest, fixtureUrl, launchChromium, postJourney } from './fixtureClient.mjs';

// A patterned page (ticket, at tickets/{ticket_id}) has one instance per ticket id. The e2e-utils
// helpers and journey replay read the state of the instance on screen.

function ticket(ticketId) {
  return { pageId: 'ticket', path: 'tickets/{ticket_id}', pathParams: { ticket_id: ticketId } };
}

fixtureTest('e2e-utils goto and the state helpers read the ticket instance on screen', async () => {
  const browser = await launchChromium();
  try {
    const context = await browser.newContext({ baseURL: fixtureUrl });
    const page = await context.newPage();
    await goto(page, ticket('1'));
    expect(page.url()).toBe(`${fixtureUrl}/tickets/1`);
    expect(await getState(page)).toEqual(expect.objectContaining({ ticket_id: '1' }));
    await setState(page, { key: 'note_input', value: 'First note' });

    await page.locator('#bl-next_ticket_button button').click();
    await waitForPage(page, ticket('2'));
    const second = await getState(page);
    expect(second.ticket_id).toBe('2');
    expect(second.note_input).not.toBe('First note');

    await page.goBack();
    await waitForPage(page, ticket('1'));
    expect(await getState(page)).toEqual(
      expect.objectContaining({ ticket_id: '1', note_input: 'First note' })
    );
  } finally {
    await browser.close();
  }
});

fixtureTest('journey replay reads the state of each ticket it opens', async () => {
  const result = await postJourney({
    pageId: 'ticket',
    pathParams: { ticket_id: '1' },
    steps: [
      { expect: { state: { path: 'ticket_id', equals: '1' } } },
      { click: 'next_ticket_button' },
      { expect: { url: { contains: '/tickets/2' } } },
      { expect: { state: { path: 'ticket_id', equals: '2' } } },
      { goto: { pageId: 'ticket', pathParams: { ticket_id: '3' } } },
      { expect: { state: { path: 'ticket_id', equals: '3' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});
