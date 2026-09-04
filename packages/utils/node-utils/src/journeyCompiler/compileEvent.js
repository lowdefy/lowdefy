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

import { type } from '@lowdefy/helpers';

import compileStateExpectations from './compileStateExpectations.js';
import resolveValueType from './resolveValueType.js';
import urlContains from './urlContains.js';

// The value the user left in the field. A dev trace carries it on the state
// write the chain made for the block's own path, and on the event payload;
// a prod trace carries neither, by design (D3).
function recordedValue({ event }) {
  const write = event.state_writes.find((entry) => entry.path === event.block_id);
  if (!type.isUndefined(write) && 'value' in write) return { value: write.value };
  if (type.isObject(event.payload) && 'value' in event.payload) {
    return { value: event.payload.value };
  }
  return undefined;
}

function compileSet({ blockMetas, blockTypes, event }) {
  if (type.isUndefined(resolveValueType({ blockMetas, blockTypes, event }))) {
    return {
      skipped: `${event.event_name} on "${event.block_id}" is not a step: the block has no valueType, so there is no value to set.`,
    };
  }
  const recorded = recordedValue({ event });
  if (type.isUndefined(recorded)) {
    // A prod trace records the shape of the interaction and nothing else. The
    // marker says the value is missing on purpose, so `lowdefy test --update`
    // or a fixture fills it rather than a reader assuming the field was cleared.
    return {
      steps: [{ set: { blockId: event.block_id, from: 'recorded-shape', value: null } }],
    };
  }
  return { steps: [{ set: { blockId: event.block_id, value: recorded.value } }] };
}

function pressKey({ event }) {
  if (event.event_name === 'onEnter') return 'Enter';
  const key = event.payload?.key;
  return type.isString(key) && key !== '' ? key : undefined;
}

function compilePress({ event }) {
  const key = pressKey({ event });
  if (type.isUndefined(key)) {
    return {
      skipped: `${event.event_name} on "${event.block_id}" is not a step: the trace records no key.`,
    };
  }
  return { steps: [{ press: { blockId: event.block_id, key } }] };
}

// A Link that succeeded moved the browser, and the journey carries on from
// wherever it landed. The url expectation is what makes the navigation part of
// the test rather than an accident of timing.
function linkExpectation({ event }) {
  const navigated = event.actions.some(
    (action) => action.type === 'Link' && action.outcome === 'ok'
  );
  if (!navigated) return [];
  const contains = urlContains({ url: event.url_after });
  return type.isUndefined(contains) ? [] : [{ expect: { url: { contains } } }];
}

function compileInteraction({ blockMetas, blockTypes, event }) {
  if (event.event_name === 'onClick') {
    return { steps: [{ click: event.block_id }] };
  }
  if (event.event_name === 'onChange') {
    return compileSet({ blockMetas, blockTypes, event });
  }
  if (event.event_name === 'onEnter' || event.event_name === 'onKeyDown') {
    return compilePress({ event });
  }
  // R12: there is no `trigger` verb. A verb that fires an event through the
  // engine skips the interaction, so a journey using it can pass while the
  // button that should fire it is hidden or absent. An event no interaction
  // reaches is named in a comment and left for a human to decide about.
  return {
    skipped: `${event.event_name} on "${event.block_id}" is not a step: no interaction reaches it.`,
  };
}

// One trace event compiles to the interaction that caused it, the url the
// navigation it made produced, and the state it wrote - in that order, which is
// the order the runner has to observe them in.
function compileEvent({ blockMetas, blockTypes, event }) {
  const { skipped, steps = [] } = compileInteraction({ blockMetas, blockTypes, event });
  return {
    skipped,
    steps: [...steps, ...linkExpectation({ event }), ...compileStateExpectations({ event })],
  };
}

export default compileEvent;
