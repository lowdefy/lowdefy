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

function exercised({ requests = [], endpoints = [], events = [] } = {}) {
  return { pages: ['tickets'], appEvents: true, requests, endpoints, events, rendered: {} };
}

function clickEvent(pageId, blockId) {
  return { scope: 'page', pageId, blockId, eventName: 'onClick', actionIds: [] };
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
    events: [clickEvent('ticket', 'save')],
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
  const withCallApi = [
    {
      blockId: 'tickets',
      type: 'Box',
      slots: {
        content: {
          blocks: [
            {
              blockId: 'save',
              type: 'Button',
              events: {
                onClick: {
                  try: [{ id: 'call', type: 'CallAPI', params: { endpointId: 'save-ticket' } }],
                },
              },
            },
          ],
        },
      },
    },
  ];
  const [variant] = doubleSubmit({ journey, exercised: viaEndpoint, pageConfigs: withCallApi });
  expect(variant.steps.at(-1)).toEqual({
    expect: { calls: { endpoint: 'save-ticket', count: 1 } },
  });
  expect(variant.steps[1]).toEqual({ click: { blockId: 'save', count: 2 } });
});

test('the submit write is the request of the page the click is on when two pages share its id', () => {
  const twoPages = {
    ...journey,
    steps: [
      { click: 'save' },
      { wait: { request: 'save' } },
      { goto: 'ticket' },
      { fill: { blockId: 'title', value: 'Printer jam' } },
      { click: 'save_ticket' },
      { wait: { request: 'save' } },
      { expect: { visible: 'saved' } },
    ],
  };
  const sharedId = exercised({
    requests: [
      { pageId: 'tickets', requestId: 'save', calls: 1, write: true },
      { pageId: 'ticket', requestId: 'save', calls: 1, write: true },
    ],
  });
  const [variant] = doubleSubmit({ journey: twoPages, exercised: sharedId, pageConfigs });
  expect(variant.steps[4]).toEqual({ click: { blockId: 'save_ticket', count: 2 } });
  expect(variant.steps.at(-1)).toEqual({
    expect: { calls: { request: 'save', pageId: 'ticket', count: 1 } },
  });
  const byEvent = exercised({
    requests: sharedId.requests,
    events: [clickEvent('tickets', 'save'), clickEvent('ticket', 'save_ticket')],
  });
  expect(interrupt({ journey: twoPages, exercised: byEvent, pageConfigs })).toEqual({
    skipped: 'the submit click is not on the start page',
  });
});

test('a write through an endpoint no CallAPI of the click names skips the kinds with a note', () => {
  const viaEndpoint = exercised({
    requests: [{ pageId: 'tickets', requestId: 'save', calls: 1, write: false }],
    endpoints: [{ endpointId: 'audit', calls: 1, write: true }],
  });
  const note = {
    skipped:
      'the click on "save" waits for "save", which does not write on page "tickets", and which endpoint it wrote through cannot be told',
  };
  [negative, interrupt, doubleSubmit].forEach((generate) => {
    expect(generate({ journey, exercised: viaEndpoint, pageConfigs, i18n: {} })).toEqual(note);
  });
});
