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

import validateJourneySteps from './validateJourneySteps.js';

test('validateJourneySteps accepts an empty list, because a snapshot may take no steps', () => {
  expect(validateJourneySteps({ steps: [] })).toEqual({});
});

test('validateJourneySteps rejects steps that are not an array', () => {
  expect(validateJourneySteps({ steps: undefined }).error).toEqual(
    'Journey "steps" should be an array of steps. Received undefined.'
  );
  expect(validateJourneySteps({ steps: 'click' }).error).toEqual(
    'Journey "steps" should be an array of steps. Received "click".'
  );
});

test('validateJourneySteps names the index and key of an unknown step', () => {
  expect(validateJourneySteps({ steps: [{ click: 'a' }, { hover: 'b' }] }).error).toEqual(
    'Step 1 has unknown key "hover". Steps are: click, fill, set, select, press, wait, screenshot, expect.'
  );
});

test('validateJourneySteps rejects a step that is not an object with exactly one key', () => {
  expect(validateJourneySteps({ steps: ['click submit'] }).error).toEqual(
    'Step 0 should be an object with exactly one key. Received "click submit".'
  );
  expect(validateJourneySteps({ steps: [{ click: 'a', press: 'Enter' }] }).error).toEqual(
    'Step 0 should be an object with exactly one key. Received {"click":"a","press":"Enter"}.'
  );
  expect(validateJourneySteps({ steps: [{}] }).error).toEqual(
    'Step 0 should be an object with exactly one key. Received {}.'
  );
});

test.each([
  [
    { click: { blockId: 'a' } },
    'Step 0 "click" requires a blockId string. Received {"blockId":"a"}.',
  ],
  [{ fill: 'title' }, 'Step 0 "fill" requires { blockId, value }. Received "title".'],
  [{ fill: { blockId: 2, value: 'x' } }, 'Step 0 "fill" requires a "blockId" string. Received 2.'],
  [
    { fill: { blockId: 'title' } },
    'Step 0 "fill" requires a "value". Received {"blockId":"title"}.',
  ],
  [{ set: 'title' }, 'Step 0 "set" requires { blockId, value }. Received "title".'],
  [{ select: { value: 'x' } }, 'Step 0 "select" requires a "blockId" string. Received undefined.'],
  [
    { press: 7 },
    'Step 0 "press" requires a key string such as "Enter" or "Mod+k", or { key, blockId }. Received 7.',
  ],
  [
    { press: { blockId: 'title' } },
    'Step 0 "press" requires a key string such as "Enter" or "Mod+k", or { key, blockId }. Received {"blockId":"title"}.',
  ],
  [
    { press: { key: 'Enter', block: 'title' } },
    'Step 0 "press" requires a key string such as "Enter" or "Mod+k", or { key, blockId }. Received {"key":"Enter","block":"title"}.',
  ],
  [{ wait: 100 }, 'Step 0 "wait" requires exactly one of "ms", "request", "state". Received 100.'],
  [{ wait: { ms: 'soon' } }, 'Step 0 "wait" requires "ms" to be a number. Received "soon".'],
  [{ wait: { request: 7 } }, 'Step 0 "wait" requires "request" to be a string. Received 7.'],
  [{ screenshot: true }, 'Step 0 "screenshot" takes an optional name string. Received true.'],
  [
    { expect: 'visible' },
    'Step 0 "expect" requires exactly one of "state", "visible", "text", "url", "dom", "durationMsUnder". Received "visible".',
  ],
  [
    { expect: { count: 2 } },
    'Step 0 "expect" requires exactly one of "state", "visible", "text", "url", "dom", "durationMsUnder". Received {"count":2}.',
  ],
  [
    { expect: { state: { equals: 1 } } },
    'Step 0 "expect.state" requires { path, equals }, or { path } alone for lowdefy test --update to fill. Received {"equals":1}.',
  ],
  [
    { expect: { state: { path: 'x', equals: 1, note: 'why' } } },
    'Step 0 "expect.state" has unknown key "note". Keys are: "path", "equals", "from".',
  ],
  [
    { expect: { state: { path: 'x', equals: 1, from: 'guessed' } } },
    'Step 0 "expect.state" "from" records where the value came from and can only be "recorded". Received "guessed".',
  ],
  [{ expect: { visible: 2 } }, 'Step 0 "expect.visible" requires a blockId string. Received 2.'],
  [
    { expect: { text: { blockId: 'title' } } },
    'Step 0 "expect.text" requires { blockId } with exactly one of "contains", "equals", "notContains" as a string. Received {"blockId":"title"}.',
  ],
  [
    { expect: { text: { blockId: 'title', contains: 'a', equals: 'a' } } },
    'Step 0 "expect.text" requires { blockId } with exactly one of "contains", "equals", "notContains" as a string. Received {"blockId":"title","contains":"a","equals":"a"}.',
  ],
  [
    { expect: { url: { equals: '/x' } } },
    'Step 0 "expect.url" requires { contains }. Received {"equals":"/x"}.',
  ],
  [
    { expect: { dom: { blockId: 'submit' } } },
    'Step 0 "expect.dom" requires { blockId } with exactly one of "hasClass", "notHasClass", "matches", "attribute", and "equals" with "attribute". Received {"blockId":"submit"}.',
  ],
  [
    { expect: { dom: { blockId: 'submit', attribute: 'aria-disabled' } } },
    'Step 0 "expect.dom" requires { blockId } with exactly one of "hasClass", "notHasClass", "matches", "attribute", and "equals" with "attribute". Received {"blockId":"submit","attribute":"aria-disabled"}.',
  ],
  [
    { expect: { dom: { blockId: 'submit', hasClass: 'a', equals: 'b' } } },
    'Step 0 "expect.dom" requires { blockId } with exactly one of "hasClass", "notHasClass", "matches", "attribute", and "equals" with "attribute". Received {"blockId":"submit","hasClass":"a","equals":"b"}.',
  ],
  [
    { expect: { dom: { blockId: 'submit', hasClass: 'a', matches: 'b' } } },
    'Step 0 "expect.dom" requires { blockId } with exactly one of "hasClass", "notHasClass", "matches", "attribute", and "equals" with "attribute". Received {"blockId":"submit","hasClass":"a","matches":"b"}.',
  ],
  [
    { expect: { durationMsUnder: 'fast' } },
    'Step 0 "expect.durationMsUnder" requires a number of milliseconds. Received "fast".',
  ],
  [
    { expect: { durationMsUnder: 500 } },
    'Step 0 "expect.durationMsUnder" measures the previous step, so it cannot be the first step.',
  ],
])('validateJourneySteps rejects malformed step %j', (step, expected) => {
  expect(validateJourneySteps({ steps: [step] }).error).toEqual(expected);
});

test('validateJourneySteps accepts durationMsUnder once a step precedes it', () => {
  expect(
    validateJourneySteps({ steps: [{ click: 'submit' }, { expect: { durationMsUnder: 500 } }] })
  ).toEqual({});
});

test('validateJourneySteps accepts an expect.state with a path and no equals, for --update to fill', () => {
  expect(validateJourneySteps({ steps: [{ expect: { state: { path: 'title' } } }] })).toEqual({});
});

test('validateJourneySteps accepts from: recorded on a filled expect.state', () => {
  expect(
    validateJourneySteps({
      steps: [{ expect: { state: { path: 'title', equals: 'done', from: 'recorded' } } }],
    })
  ).toEqual({});
});
