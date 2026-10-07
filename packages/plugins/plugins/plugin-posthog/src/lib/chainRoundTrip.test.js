/**
 * @jest-environment jsdom
 */
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

import { targetFixtures } from '@lowdefy/e2e-utils/targets';
import { filterElementsChain, targetFromElementsChain } from '@lowdefy/helpers';
import { autocapturePropertiesForElement } from 'posthog-js/lib/src/autocapture.js';

import enrichEvent from './enrichEvent.js';
import postHogState from './postHogState.js';
import createFakeTrace from '../test/createFakeTrace.js';
import resetPostHogState from '../test/resetPostHogState.js';

// The chain posthog-js itself records for a click on the element, with the version this plugin
// pins. A posthog-js upgrade that changes the chain format fails here.
function propsOf(element) {
  return autocapturePropertiesForElement(element, {
    e: { type: 'click' },
    elementsChainAsString: true,
  }).props;
}

function chainOf(element) {
  return propsOf(element).$elements_chain;
}

// The production event posthog-js captures for a click on the element, through enrichEvent with a
// trace whose describeChain reads the chain as the engine's does, and `configTexts` as the page's
// config text.
function enrichedClick({ element, configTexts }) {
  resetPostHogState();
  postHogState.trace = createFakeTrace({
    configTexts,
    describeChain: (chain) => ({
      ...targetFromElementsChain(chain),
      page_id: 'orders',
      block_type: null,
      nth: null,
    }),
  });
  const { $elements_chain: chain, $el_text: elText } = propsOf(element);
  const properties = { $elements_chain: chain };
  if (typeof elText === 'string') properties.$el_text = elText;
  return enrichEvent({ event: '$autocapture', properties }).properties;
}

// The fixture's canonical target without nth, which the chain cannot carry. The engine's tests
// check describeElement against the same fixtures, so the chain parser and describeElement agree.
// (The engine is not a dependency here: it would close a package cycle through @lowdefy/build.)
function chainTarget({ target, blockIds }) {
  return {
    block_id: target.block_id,
    row: target.row,
    column: target.column,
    text: target.text,
    option: target.option,
    block_ids: blockIds,
  };
}

afterEach(() => {
  document.body.innerHTML = '';
});

test.each(targetFixtures.map((fixture) => [fixture.name, fixture]))(
  'the posthog-js chain of a click parses to the fixture target: %s',
  (name, fixture) => {
    document.body.innerHTML = fixture.html;
    const clicked = document.querySelector(fixture.clicked ?? fixture.element);
    const chain = chainOf(clicked);
    expect(typeof chain).toBe('string');
    expect(targetFromElementsChain(chain)).toEqual(chainTarget(fixture));
  }
);

test.each(targetFixtures.map((fixture) => [fixture.name, fixture]))(
  'filterElementsChain keeps the posthog-js chain of a click byte for byte when it keeps every attribute: %s',
  (name, fixture) => {
    document.body.innerHTML = fixture.html;
    const chain = chainOf(document.querySelector(fixture.clicked ?? fixture.element));
    expect(filterElementsChain({ chain, filterAttribute: ({ value }) => value })).toBe(chain);
  }
);

test.each(
  targetFixtures
    .filter((fixture) => fixture.target.text !== null)
    .map((fixture) => [fixture.name, fixture])
)(
  'enrichEvent sends the control text the dev recorder reads as lowdefy_text: %s',
  (name, fixture) => {
    document.body.innerHTML = fixture.html;
    const properties = enrichedClick({
      element: document.querySelector(fixture.clicked ?? fixture.element),
      configTexts: [fixture.target.text],
    });
    expect(properties.lowdefy_text).toBe(fixture.target.text);
  }
);

// posthog-js reads only the clicked element's direct text, so a click on a button's icon has no
// $el_text; the chain still holds the button's text.
const ICON_BUTTON =
  '<div id="bl-save_button"><button type="button"><span class="anticon"><svg></svg></span><span>Save</span></button></div>';

test('enrichEvent sends the control text when the click lands on a child without text', () => {
  document.body.innerHTML = ICON_BUTTON;
  const properties = enrichedClick({
    element: document.querySelector('.anticon'),
    configTexts: ['Save'],
  });
  expect(properties.$el_text).toBeUndefined();
  expect(properties.lowdefy_text).toBe('Save');
});

test('enrichEvent masks lowdefy_text as it masks $el_text', () => {
  document.body.innerHTML = ICON_BUTTON.replace('Save', 'Jane Customer');
  const properties = enrichedClick({
    element: document.querySelector('.anticon'),
    configTexts: ['Save'],
  });
  expect(properties).not.toHaveProperty('lowdefy_text');
});
