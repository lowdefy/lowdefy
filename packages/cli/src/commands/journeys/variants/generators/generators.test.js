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

import doubleSubmit from './doubleSubmit.js';
import interrupt from './interrupt.js';
import negative from './negative.js';

function exercised({ requests = [], endpoints = [] } = {}) {
  return { pages: ['tickets'], appEvents: true, requests, endpoints, events: [], rendered: {} };
}

const writes = exercised({
  requests: [{ pageId: 'tickets', requestId: 'save', calls: 1, write: true }],
});

const pageConfigs = [
  {
    blockId: 'tickets',
    type: 'Box',
    slots: { content: { blocks: [{ blockId: 'title', type: 'TextInput', required: true }] } },
  },
];

const journey = {
  name: 'saves a ticket',
  pageId: 'tickets',
  steps: [
    { fill: { blockId: 'title', value: 'Printer jam' } },
    { click: 'save' },
    { wait: { request: 'save' } },
    { expect: { visible: 'saved' } },
  ],
};

test('every kind is skipped with its note when the journey has no submit click', () => {
  const noWrite = exercised({
    requests: [{ pageId: 'tickets', requestId: 'save', calls: 1, write: false }],
  });
  const note = { skipped: 'no submit click: no click followed by a wait for a write request' };
  [negative, interrupt, doubleSubmit].forEach((generate) => {
    expect(generate({ journey, exercised: noWrite, pageConfigs, i18n: {} })).toEqual(note);
  });
});

test('negative is skipped when no fill before the submit click has a rule', () => {
  const plain = [{ blockId: 'tickets', type: 'Box', slots: { content: { blocks: [] } } }];
  expect(negative({ journey, exercised: writes, pageConfigs: plain, i18n: {} })).toEqual({
    skipped: 'no fill before the submit click is on a block with required or validate',
  });
});

test('negative takes the block required message, else the app default-locale fieldRequired', () => {
  const [fallback] = negative({ journey, exercised: writes, pageConfigs, i18n: {} });
  expect(fallback.steps[2]).toEqual({
    expect: { text: { blockId: 'title', contains: 'This field is required' } },
  });
  const [translated] = negative({
    journey,
    exercised: writes,
    pageConfigs,
    i18n: {
      defaultLocale: 'fr',
      messages: { fr: { 'engine.validation.fieldRequired': 'Ce champ est obligatoire' } },
    },
  });
  expect(translated.steps[2].expect.text.contains).toBe('Ce champ est obligatoire');
  const own = [
    {
      blockId: 'tickets',
      type: 'Box',
      slots: {
        content: { blocks: [{ blockId: 'title', type: 'TextInput', required: 'Give it a title' }] },
      },
    },
  ];
  const [custom] = negative({ journey, exercised: writes, pageConfigs: own, i18n: {} });
  expect(custom.steps[2].expect.text.contains).toBe('Give it a title');
});

test('interrupt is skipped when the submit click is not on the start page', () => {
  const elsewhere = exercised({
    requests: [{ pageId: 'ticket', requestId: 'save', calls: 1, write: true }],
  });
  expect(interrupt({ journey, exercised: elsewhere })).toEqual({
    skipped: 'the submit click is not on the start page',
  });
});

test('interrupt reloads the start page with its urlQuery', () => {
  const [variant] = interrupt({
    journey: { ...journey, urlQuery: { id: 't1' } },
    exercised: writes,
  });
  expect(variant.steps[1]).toEqual({ goto: { pageId: 'tickets', urlQuery: { id: 't1' } } });
});

test('a write through an endpoint is counted with expect.calls on the endpoint', () => {
  const viaEndpoint = exercised({
    requests: [{ pageId: 'tickets', requestId: 'save', calls: 1, write: false }],
    endpoints: [
      { endpointId: 'save-ticket', calls: 1, write: true },
      { endpointId: 'log', via: 'save-ticket', calls: null, write: true },
    ],
  });
  const [variant] = doubleSubmit({ journey, exercised: viaEndpoint });
  expect(variant.steps.at(-1)).toEqual({
    expect: { calls: { endpoint: 'save-ticket', count: 1 } },
  });
  expect(variant.steps[1]).toEqual({ click: { blockId: 'save', count: 2 } });
});
