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

import { fixtureTest, postJourney } from './fixtureClient.mjs';
import { expect } from 'vitest';

// The data-set rails: on a journey with a data set, a click that would reach a
// connection whose type declares nothing or has no artifact is refused at that
// step before it acts. A click that runs an auth action fails at that step once
// it has run (the rail acts at runtime), and one whose auth action is skipped
// passes. A click whose request uses
// the data set's MongoDB connection (which declares redirect) works, and one
// whose request uses an external connection (AxiosHttp) works too: the request
// is sunk, recorded on the result and never sent.

fixtureTest(
  'a data-set journey clicking logout_button fails at that step, as the auth action ran',
  async () => {
    const result = await postJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [{ expect: { visible: 'rails_title' } }, { click: 'logout_button' }],
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(1);
    expect(result.failure.actual).toBe('a click that ran the auth action Logout');
    expect(result.failure.message).toMatch(/Block "logout_button" ran the auth action Logout/);
  }
);

fixtureTest(
  'a data-set journey clicking a button whose auth action is skipped passes',
  async () => {
    const result = await postJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [{ click: 'skipped_logout_button' }, { expect: { visible: 'logout_checked_alert' } }],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
  }
);

// The request's connection is an AxiosHttp pointed at a port nothing listens on: a request that
// was sent would fail the journey with a connection error. Under a data session it is sunk.
fixtureTest.each([
  ['by block id', { click: 'external_button' }],
  ['by its text', { click: { text: 'Call external' } }],
])('a data-set journey clicking an external request %s sinks it', async (_, click) => {
  const result = await postJourney({
    pageId: 'rails',
    data: 'rails',
    user: 'member',
    steps: [{ expect: { visible: 'rails_title' } }, click, { wait: { request: 'call_external' } }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.sunk).toEqual([
    expect.objectContaining({
      connectionId: 'rails_external',
      connectionType: 'AxiosHttp',
      requestType: 'AxiosHttp',
      requestId: 'call_external',
      pageId: 'rails',
    }),
  ]);
});

fixtureTest('a data-set journey clicking a button whose request uses MongoDB passes', async () => {
  const result = await postJourney({
    pageId: 'rails',
    data: 'rails',
    user: 'member',
    steps: [
      { click: 'save_rail_button' },
      { wait: { request: 'save_rail_item' } },
      { expect: { visible: 'rail_saved_alert' } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

// A modal's OK button is drawn in a portal outside every block wrapper, so the click rails read
// the block a control target names, not the one around the clicked element.
fixtureTest(
  "a data-set journey clicking a modal's ok control is refused when its onOk reaches an undeclared connection",
  async () => {
    const result = await postJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [
        { click: 'open_rails_modal_button' },
        { click: { blockId: 'rails_modal', control: 'ok' } },
      ],
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(1);
    expect(result.failure.message).toBe(
      'Block "rails_modal" reaches connection "rails_undeclared" (UndeclaredFixture, no dataSet declaration), which a data set cannot redirect, so a data-set journey cannot click it.'
    );
    expect(result.failure.actual).toBe(
      'a click that reaches connection "rails_undeclared" (UndeclaredFixture, no dataSet declaration)'
    );
  }
);

// A dropdown item shows only once its dropdown is open, and opening it fires the block's
// onOpenChange, so the rails check the block before the runner opens it.
fixtureTest(
  'a data-set journey clicking a dropdown item control is refused before the dropdown opens',
  async () => {
    const result = await postJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [{ click: { blockId: 'rails_dropdown', control: 'onCallUndeclared' } }],
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(0);
    expect(result.failure.message).toBe(
      'Block "rails_dropdown" reaches connection "rails_undeclared" (UndeclaredFixture, no dataSet declaration), which a data set cannot redirect, so a data-set journey cannot click it.'
    );
    expect(result.state.rails_dropdown_opened ?? null).toBe(null);
  }
);

fixtureTest('a journey without a data set is not railed', async () => {
  const result = await postJourney({
    pageId: 'rails',
    steps: [{ click: 'logout_button' }],
  });
  expect(result.failure?.actual ?? '').not.toMatch('auth action');
});
