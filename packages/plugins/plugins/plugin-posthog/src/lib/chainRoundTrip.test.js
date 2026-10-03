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

import { getTrace } from '@lowdefy/engine';
import { targetFixtures } from '@lowdefy/e2e-utils/targets';
import { targetFromElementsChain } from '@lowdefy/helpers';
import { autocapturePropertiesForElement } from 'posthog-js/lib/src/autocapture.js';

// The chain posthog-js itself records for a click on the element, with the version this plugin
// pins. A posthog-js upgrade that changes the chain format fails here.
function chainOf(element) {
  return autocapturePropertiesForElement(element, {
    e: { type: 'click' },
    elementsChainAsString: true,
  }).props.$elements_chain;
}

function withoutBrowserFields({ nth, page_id, block_type, ...target }) {
  return target;
}

afterEach(() => {
  document.body.innerHTML = '';
});

test.each(targetFixtures.map((fixture) => [fixture.name, fixture]))(
  'the posthog-js chain of a click parses to the described target: %s',
  (name, fixture) => {
    const { describeElement } = getTrace({ basePath: '', contexts: {}, home: {} });
    document.body.innerHTML = fixture.html;
    const clicked = document.querySelector(fixture.clicked ?? fixture.element);
    const chain = chainOf(clicked);
    expect(typeof chain).toBe('string');
    expect(targetFromElementsChain(chain)).toEqual(withoutBrowserFields(describeElement(clicked)));
  }
);
