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

import { fixtureTest, postBrowserJourney, postJourney } from './fixtureClient.mjs';
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

// A modal's OK button is drawn in a portal outside every block wrapper, so the step rails read
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

// Open, fill and select act on a block and fire its events too (onOpenChange, onChange), so the
// rails check them as they check a click, before they act, in the browser and headless.
const UNDECLARED = '(UndeclaredFixture, no dataSet declaration), which a data set cannot redirect';

fixtureTest(
  'a data-set journey opening a dropdown whose onOpenChange reaches an undeclared connection is refused before it opens',
  async () => {
    const result = await postJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [{ expect: { visible: 'rails_title' } }, { open: 'rails_menu' }],
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(1);
    expect(result.failure.message).toBe(
      `Block "rails_menu" reaches connection "rails_undeclared" ${UNDECLARED}, so a data-set journey cannot open it.`
    );
    expect(result.failure.expected).toBe('an open a data-set journey can make');
    expect(result.state.rails_menu_opened ?? null).toBe(null);
  }
);

// A click on a DropdownMenu lands on the button in its content, and that click reaches the
// dropdown's trigger, which opens it: the rails check the button, then the dropdown.
fixtureTest(
  'a data-set journey clicking a dropdown whose onOpenChange reaches an undeclared connection is refused before it opens',
  async () => {
    const result = await postJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [{ expect: { visible: 'rails_title' } }, { click: 'rails_menu' }],
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(1);
    expect(result.failure.message).toBe(
      `Block "rails_menu" reaches connection "rails_undeclared" ${UNDECLARED}, so a data-set journey cannot click it.`
    );
    expect(result.state.rails_menu_opened ?? null).toBe(null);
  }
);

fixtureTest(
  'a data-set journey filling an input whose onChange reaches an undeclared connection is refused',
  async () => {
    const result = await postJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [{ fill: { blockId: 'rails_fill_input', value: 'note' } }],
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(0);
    expect(result.failure.message).toBe(
      `Block "rails_fill_input" reaches connection "rails_undeclared" ${UNDECLARED}, so a data-set journey cannot fill it.`
    );
    expect(result.failure.actual).toBe(
      'a fill that reaches connection "rails_undeclared" (UndeclaredFixture, no dataSet declaration)'
    );
    expect(result.state.rails_fill_input ?? null).toBe(null);
  }
);

// A select on a container picks in the input inside it, so the rails check that input's block.
fixtureTest.each([
  ['the selector', 'rails_selector'],
  ['the container around it', 'rails_choice_box'],
])(
  'a data-set journey selecting through %s, whose onChange reaches an undeclared connection, is refused',
  async (_, blockId) => {
    const result = await postJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [{ select: { blockId, value: 'Second' } }],
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(0);
    expect(result.failure.message).toBe(
      `Block "rails_selector" reaches connection "rails_undeclared" ${UNDECLARED}, so a data-set journey cannot select in it.`
    );
    expect(result.state.rails_selector ?? null).toBe(null);
  }
);

// The same steps on a journey with no data set act, so the refusals above are the rails'. In the
// browser only: the parity check's build host runs every call on a data session, whose gate
// refuses the undeclared connection these blocks reach, where the dev server runs a journey with
// no data set on none.
fixtureTest(
  'a journey without a data set opens, fills and selects on the railed blocks',
  async () => {
    const result = await postBrowserJourney({
      pageId: 'rails',
      steps: [
        { open: 'rails_menu' },
        { fill: { blockId: 'rails_fill_input', value: 'note' } },
        { select: { blockId: 'rails_selector', value: 'Second' } },
      ],
    });
    expect(result.failure).toBeUndefined();
    expect(result.state.rails_menu_opened).toBe(true);
    expect(result.state.rails_fill_input).toBe('note');
    expect(result.state.rails_selector).toBe('Second');
  }
);

fixtureTest('a journey without a data set is not railed', async () => {
  const result = await postJourney({
    pageId: 'rails',
    steps: [{ click: 'logout_button' }],
  });
  expect(result.failure?.actual ?? '').not.toMatch('auth action');
});

// A container can hold two radio groups. A select on it picks the option labelled with the
// value in whichever group holds it, so the rails check that option's group, not the first.
fixtureTest(
  'a data-set journey selecting through a container is checked against the group the option is in',
  async () => {
    const refused = await postBrowserJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [{ select: { blockId: 'rails_radio_box', value: 'Gamma' } }],
    });
    expect(refused.passed).toBe(false);
    expect(refused.failure.index).toBe(0);
    expect(refused.failure.message).toBe(
      `Block "rails_railed_radio" reaches connection "rails_undeclared" ${UNDECLARED}, so a data-set journey cannot select in it.`
    );
    expect(refused.state.rails_railed_radio ?? null).toBe(null);

    const picked = await postBrowserJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [{ select: { blockId: 'rails_radio_box', value: 'Alpha' } }],
    });
    expect(picked.failure).toBeUndefined();
    expect(picked.state.rails_safe_radio).toBe('Alpha');
  }
);

// A press fires the events of the block a block's `shortcut` binds to the chord, and of the
// focused block, so the rails check both before the key goes down.
fixtureTest(
  'a data-set journey pressing a shortcut whose onClick reaches an undeclared connection is refused',
  async () => {
    const result = await postBrowserJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [{ expect: { visible: 'rails_title' } }, { press: 'Mod+k' }],
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(1);
    expect(result.failure.message).toBe(
      `Block "rails_shortcut_button" reaches connection "rails_undeclared" ${UNDECLARED}, so a data-set journey cannot press a key that fires its events.`
    );
    expect(result.failure.expected).toBe('a press a data-set journey can make');
  }
);

fixtureTest('a data-set journey pressing a shortcut on an unrailed block passes', async () => {
  const result = await postBrowserJourney({
    pageId: 'rails',
    data: 'rails',
    user: 'member',
    steps: [{ expect: { visible: 'rails_title' } }, { press: 'Mod+j' }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.state.rails_shortcut_ran).toBe(true);
});

fixtureTest(
  'a data-set journey pressing Enter in an input whose onPressEnter runs Logout fails at that step',
  async () => {
    const result = await postBrowserJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [{ fill: { blockId: 'rails_enter_logout_input', value: 'bye' } }, { press: 'Enter' }],
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(1);
    expect(result.failure.actual).toBe('a press that ran the auth action Logout');
    expect(result.failure.message).toMatch(
      /Block "rails_enter_logout_input" ran the auth action Logout/
    );
  }
);

// An open modal draws its dialog in a portal outside every block wrapper, and Escape there fires
// its onCancel, so the rails check the block whose portal holds the focused element.
// A headless press is Enter in the input filled last, so this one runs in both runners: Enter in
// an input inside a modal can fire the modal's events, and both refuse it as the modal's.
fixtureTest(
  'a data-set journey pressing Enter in an input in a modal whose onCancel reaches an undeclared connection is refused',
  async () => {
    const result = await postJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [
        { click: 'open_rails_escape_modal_button' },
        { fill: { blockId: 'rails_escape_modal_note', value: 'Note' } },
        { press: 'Enter' },
      ],
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(2);
    expect(result.failure.message).toBe(
      `Block "rails_escape_modal" reaches connection "rails_undeclared" ${UNDECLARED}, so a data-set journey cannot press a key that fires its events.`
    );
  }
);

fixtureTest(
  'a data-set journey pressing Escape in a modal whose onCancel reaches an undeclared connection is refused',
  async () => {
    const result = await postBrowserJourney({
      pageId: 'rails',
      data: 'rails',
      user: 'member',
      steps: [
        { click: 'open_rails_escape_modal_button' },
        { expect: { visible: 'rails_escape_modal_body' } },
        { press: 'Escape' },
      ],
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(2);
    expect(result.failure.message).toBe(
      `Block "rails_escape_modal" reaches connection "rails_undeclared" ${UNDECLARED}, so a data-set journey cannot press a key that fires its events.`
    );
  }
);
