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

import flowLines from './flowLines.js';
import parseFlowLines from './parseFlowLines.js';
import sequenceId, { SEQUENCE_VERSION } from './sequenceId.js';
import sequenceVersion from './sequenceVersion.js';

const steps = [
  { click: { blockId: 'assign_button', text: 'Assign' } },
  { select: { blockId: 'assignee', value: 'Ann' } },
  { click: 'assign_submit' },
  { expect: { text: { blockId: 'status', equals: 'Assigned' } } },
];

const routeTable = {
  routes: [
    { pageId: 'board', path: 'board' },
    { pageId: 'tickets', path: 'tickets' },
  ],
  basePath: '',
};

const id = sequenceId({ pageId: 'tickets', steps });

test('sequenceId is the matcher version and eight hex characters', () => {
  expect(id).toMatch(/^v1-[0-9a-f]{8}$/);
  expect(SEQUENCE_VERSION).toBe(1);
  expect(sequenceVersion({ sequence: id })).toBe(1);
  expect(sequenceVersion({ sequence: 'v12-00000000' })).toBe(12);
});

test.each([
  ['the pageId', { pageId: 'board', steps }],
  [
    "a click's text",
    {
      pageId: 'tickets',
      steps: [{ click: { blockId: 'assign_button', text: 'Give' } }, ...steps.slice(1)],
    },
  ],
  ['a block id', { pageId: 'tickets', steps: [...steps.slice(0, 2), { click: 'save' }, steps[3]] }],
  ['the order', { pageId: 'tickets', steps: [steps[1], steps[0], ...steps.slice(2)] }],
  ['a removed interaction', { pageId: 'tickets', steps: [steps[0], ...steps.slice(2)] }],
  ['a goto', { pageId: 'tickets', steps: [steps[0], { goto: 'board' }, ...steps.slice(1)] }],
  [
    'an expect.url path that moves later steps',
    {
      pageId: 'tickets',
      steps: [steps[0], { expect: { url: { contains: '/board' } } }, ...steps.slice(1)],
    },
  ],
])('sequenceId changes with %s', (_, journey) => {
  expect(sequenceId({ ...journey, routeTable })).not.toBe(id);
});

test.each([
  ['a wait', [...steps, { wait: 500 }]],
  ['another expectation', [...steps, { expect: { visible: 'status' } }]],
  [
    'a picked value',
    [steps[0], { select: { blockId: 'assignee', value: 'Bob' } }, ...steps.slice(2)],
  ],
  [
    'a row and nth',
    [{ click: { blockId: 'assign_button', text: 'Assign', row: 2, nth: 1 } }, ...steps.slice(1)],
  ],
  [
    'an expect.url that is not a path',
    [steps[0], { expect: { url: { contains: 'tab=' } } }, ...steps.slice(1)],
  ],
])('sequenceId is unchanged by %s', (_, edited) => {
  expect(sequenceId({ pageId: 'tickets', steps: edited })).toBe(id);
});

test('flowLines writes one <page> <identity> line per interaction and parseFlowLines reads them back', () => {
  const flow = flowLines({
    pageId: 'tickets',
    steps: [...steps, { goto: 'board' }, { click: 'x' }],
  });
  expect(flow).toEqual([
    'tickets ["click","assign_button",null,"Assign"]',
    'tickets ["select","assignee",null,null]',
    'tickets ["click","assign_submit",null,null]',
    'board ["click","x",null,null]',
  ]);
  expect(parseFlowLines({ flow })).toEqual([
    { page: 'tickets', identity: '["click","assign_button",null,"Assign"]' },
    { page: 'tickets', identity: '["select","assignee",null,null]' },
    { page: 'tickets', identity: '["click","assign_submit",null,null]' },
    { page: 'board', identity: '["click","x",null,null]' },
  ]);
});

test('parseFlowLines keeps a space inside the identity', () => {
  expect(parseFlowLines({ flow: ['tickets ["click","a",null,"Save changes"]'] })).toEqual([
    { page: 'tickets', identity: '["click","a",null,"Save changes"]' },
  ]);
});
