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

// What a journey's own pages observed (client/JourneyObserver.jsx): the
// Lowdefy events that completed, from the engine's trace hook, and the blocks
// that were ever visible.

function hasEvent(events, { pageId, blockId, eventName }) {
  return events.some(
    (event) => event.pageId === pageId && event.blockId === blockId && event.eventName === eventName
  );
}

fixtureTest(
  'events include a click and a programmatic page event, and leave out a debounce that never completed',
  async () => {
    const result = await postJourney({
      pageId: 'home',
      steps: [
        { fill: { blockId: 'name_input', value: 'Observed item' } },
        { click: 'save_button' },
        { wait: { request: 'save_item' } },
        { expect: { visible: 'save_success' } },
        // Trailing-edge debounce of a minute: the second change bounces the
        // first, and neither completes while the journey runs. Last, since a
        // pending debounce keeps the page from settling after each step.
        { fill: { blockId: 'debounce_input', value: 'first' } },
        { fill: { blockId: 'debounce_input', value: 'second' } },
        { expect: { visible: 'home_title' } },
      ],
    });
    expect(result.failure).toBeUndefined();
    const { events } = result.exercised;
    expect(events).toContainEqual({
      scope: 'page',
      pageId: 'home',
      blockId: 'save_button',
      eventName: 'onClick',
      actionIds: ['save', 'set_saved'],
    });
    // Fired by the page itself on mount, not by a person.
    expect(hasEvent(events, { pageId: 'home', blockId: 'home', eventName: 'onMount' })).toBe(true);
    expect(
      hasEvent(events, { pageId: 'home', blockId: 'debounce_input', eventName: 'onChange' })
    ).toBe(false);
  }
);

fixtureTest('an event whose actions end in a full page load is still reported', async () => {
  const result = await postJourney({
    pageId: 'home',
    steps: [{ click: 'url_link_button' }, { expect: { visible: 'second_title' } }],
  });
  expect(result.failure).toBeUndefined();
  expect(
    hasEvent(result.exercised.events, {
      pageId: 'home',
      blockId: 'url_link_button',
      eventName: 'onClick',
    })
  ).toBe(true);
  expect(result.exercised.rendered.second).toContain('second_title');
});

fixtureTest(
  'rendered keeps an alert shown and cleared within one chain, and a modal opened and closed',
  async () => {
    const result = await postJourney({
      pageId: 'home',
      steps: [
        { click: 'flash_button' },
        { click: 'open_modal_button' },
        { expect: { visible: 'modal_text' } },
        { click: 'close_modal_button' },
        { expect: { visible: 'home_title' } },
      ],
    });
    expect(result.failure).toBeUndefined();
    const rendered = result.exercised.rendered.home;
    expect(rendered).toEqual(
      expect.arrayContaining(['flash_alert', 'confirm_modal', 'modal_text', 'rows.$.label'])
    );
    // Only block ids: a List item's slot wrappers are not blocks.
    expect(rendered.filter((blockId) => blockId.startsWith('rows-'))).toEqual([]);
    // Mounted with forceRender, never opened.
    expect(rendered).not.toContain('forced_modal');
    expect(rendered).not.toContain('forced_text');
    expect(rendered).not.toContain('hidden_text');
    // Shown only after a save, which this journey never made.
    expect(rendered).not.toContain('save_success');
  }
);
