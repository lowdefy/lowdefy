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

import lintJourney from './lintJourney.js';
import { expect, test } from 'vitest';

function journey(steps, extra = {}) {
  return { name: 'assigns a ticket', pageId: 'tickets', steps, ...extra };
}

function entry({ events = [], requests = [], endpoints = [], controls = [] } = {}) {
  return {
    hash: 'h',
    passed: true,
    exercised: {
      pages: ['tickets'],
      appEvents: true,
      requests,
      endpoints,
      events,
      rendered: {},
      controls,
    },
  };
}

function event(blockId, eventName = 'onClick') {
  return { scope: 'page', pageId: 'tickets', blockId, eventName, actionIds: [] };
}

function rules(problems, rule) {
  return problems.filter((problem) => problem.rule === rule);
}

test('L1 refuses placeholders on fill, select and expect.state, and null values', () => {
  const problems = lintJourney({
    journey: journey([
      { fill: { blockId: 'title', value: null, from: 'shape' } },
      { select: { blockId: 'status', value: 'Open', from: 'shape' } },
      { fill: { blockId: 'note', value: 'Recorded', from: 'recorded' } },
      { expect: { state: { path: 'a', equals: null, from: 'shape' } } },
    ]),
    exercisedEntry: entry(),
  });
  expect(rules(problems, 'L1').map(({ stepIndex }) => stepIndex)).toEqual([0, 1, 3]);
  expect(rules(problems, 'L1')[0]).toEqual({
    rule: 'L1',
    severity: 'error',
    stepIndex: 0,
    message:
      'step 0 (fill "title") is a placeholder (from: shape or value: null): write the value it needs.',
  });
});

test('L2 refuses an event-running click with no assertion before the next action', () => {
  const problems = lintJourney({
    journey: journey([
      { click: 'assign_submit' },
      { click: 'close' },
      { expect: { visible: 'done' } },
    ]),
    exercisedEntry: entry({ events: [event('assign_submit')] }),
  });
  expect(rules(problems, 'L2')).toEqual([
    {
      rule: 'L2',
      severity: 'error',
      stepIndex: 0,
      message:
        'step 0 (click "assign_submit") is not followed by an expect or wait: { request } before step 1.',
    },
  ]);
});

test('L2 exempts input steps and event-less clicks, and counts as, email and screenshot as neutral', () => {
  const problems = lintJourney({
    journey: journey([
      { fill: { blockId: 'title', value: 'A' } },
      { select: { blockId: 'status', value: 'Open' } },
      { click: 'tab_header' },
      { click: { blockId: 'rows.2.edit' } },
      { screenshot: 'before' },
      { as: 'member' },
      { expect: { hidden: 'error_alert' } },
    ]),
    exercisedEntry: entry({ events: [event('rows.$.edit'), event('title', 'onChange')] }),
  });
  expect(rules(problems, 'L2')).toEqual([]);
});

test('L2 always checks goto and back, and an event that only mounted does not count', () => {
  const problems = lintJourney({
    journey: journey([
      { goto: 'tickets' },
      { click: 'panel' },
      { back: true },
      { expect: { calls: { request: 'save', count: 0 } } },
    ]),
    exercisedEntry: entry({ events: [event('panel', 'onMount')] }),
  });
  expect(rules(problems, 'L2').map(({ message }) => message)).toEqual([
    'step 0 (goto "tickets") is not followed by an expect or wait: { request } before step 1.',
  ]);
});

test('L2 checks strictly with no measured run, and says to run the journey once', () => {
  const problems = lintJourney({
    journey: journey([{ click: 'tab_header' }, { press: 'Enter' }, { wait: { request: 'save' } }]),
    exercisedEntry: null,
  });
  expect(rules(problems, 'L2').map(({ message }) => message)).toEqual([
    'step 0 (click "tab_header") is not followed by an expect or wait: { request } before step 1. Run the journey once (lowdefy test) so lint can tell whether it ran an event.',
  ]);
});

test('L2 checks a click with no blockId strictly', () => {
  const problems = lintJourney({
    journey: journey([{ click: { text: 'Delete' } }]),
    exercisedEntry: entry(),
  });
  expect(rules(problems, 'L2')[0].message).toBe(
    'step 0 (click "Delete") is not followed by an expect or wait: { request } before the journey ends.'
  );
});

test('L3 refuses a fixed wait', () => {
  const problems = lintJourney({
    journey: journey([
      { wait: { ms: 500 } },
      { wait: { state: 'a' } },
      { wait: 500 },
      { expect: { visible: 'a' } },
    ]),
    exercisedEntry: entry(),
  });
  expect(rules(problems, 'L3')).toEqual([
    {
      rule: 'L3',
      severity: 'error',
      stepIndex: 0,
      message:
        'step 0 (wait: { ms }) waits a fixed time: wait for a request or a state, or expect the outcome, instead.',
    },
    {
      rule: 'L3',
      severity: 'error',
      stepIndex: 2,
      message:
        'step 2 (wait: { ms }) waits a fixed time: wait for a request or a state, or expect the outcome, instead.',
    },
  ]);
});

test('L4 refuses a journey that wrote without data, and only warns with no measured run', () => {
  const writes = entry({
    requests: [{ pageId: 'tickets', requestId: 'assign', calls: 1, write: true }],
  });
  const steps = [{ expect: { visible: 'a' } }];
  expect(rules(lintJourney({ journey: journey(steps), exercisedEntry: writes }), 'L4')).toEqual([
    {
      rule: 'L4',
      severity: 'error',
      message: 'writes (request "assign" on page "tickets") but declares no data: set.',
    },
  ]);
  expect(
    rules(
      lintJourney({ journey: journey(steps, { data: 'tickets' }), exercisedEntry: writes }),
      'L4'
    )
  ).toEqual([]);
  expect(
    rules(
      lintJourney({
        journey: journey(steps),
        exercisedEntry: entry({
          endpoints: [{ endpointId: 'log', via: 'notify', calls: null, write: true }],
        }),
      }),
      'L4'
    )[0].message
  ).toBe('writes (endpoint "log") but declares no data: set.');
  expect(rules(lintJourney({ journey: journey(steps), exercisedEntry: null }), 'L4')).toEqual([
    {
      rule: 'L4',
      severity: 'warning',
      message: 'not checked for writes: run lowdefy test once so lint can see what it calls.',
    },
  ]);
});

test('L6 refuses a journey that does not end on an assertion, and accepts expect.hidden, expect.calls and a final wait for a request', () => {
  expect(
    rules(lintJourney({ journey: journey([{ click: 'save' }]), exercisedEntry: entry() }), 'L6')
  ).toEqual([
    {
      rule: 'L6',
      severity: 'error',
      stepIndex: 0,
      message: 'the last step, step 0 (click "save"), is not an expect or wait: { request }.',
    },
  ]);
  [
    { expect: { hidden: 'a' } },
    { expect: { calls: { endpoint: 'notify', count: 1 } } },
    { wait: { request: 'save' } },
  ].forEach((last) => {
    expect(rules(lintJourney({ journey: journey([last]), exercisedEntry: entry() }), 'L6')).toEqual(
      []
    );
  });
});

test('a compiled candidate, with event-less clicks and a final wait for a request, lints without errors', () => {
  const problems = lintJourney({
    journey: journey([
      { click: 'tab_header' },
      { fill: { blockId: 'title', value: 'Printer jam', from: 'recorded' } },
      { click: 'assign_submit' },
      { wait: { request: 'assign' } },
    ]),
    exercisedEntry: entry({ events: [event('assign_submit')] }),
  });
  expect(problems.filter(({ severity }) => severity === 'error')).toEqual([]);
});

test('L7 warns on an as that names the person already acting', () => {
  const problems = lintJourney({
    journey: journey([
      { as: 'main' },
      { as: 'owner' },
      { expect: { visible: 'inbox' } },
      { as: 'owner' },
      { as: 'main' },
      { as: 'main' },
      { expect: { visible: 'inbox' } },
    ]),
    exercisedEntry: entry(),
  });
  expect(rules(problems, 'L7')).toEqual([
    {
      rule: 'L7',
      severity: 'warning',
      stepIndex: 0,
      message:
        'step 0 (as "main") switches to the journey\'s own user (main), who is already acting: name the other person, or drop the step.',
    },
    {
      rule: 'L7',
      severity: 'warning',
      stepIndex: 3,
      message:
        'step 3 (as "owner") switches to "owner", who is already acting: name the other person, or drop the step.',
    },
    {
      rule: 'L7',
      severity: 'warning',
      stepIndex: 5,
      message:
        'step 5 (as "main") switches to the journey\'s own user (main), who is already acting: name the other person, or drop the step.',
    },
  ]);
});

test('L7 accepts switching to a second person and back', () => {
  const problems = lintJourney({
    journey: journey([{ as: 'owner' }, { as: 'main' }, { expect: { visible: 'inbox' } }]),
    exercisedEntry: entry(),
  });
  expect(rules(problems, 'L7')).toEqual([]);
});

test('L2 and L6 treat call and request as interactions, and expect status, error and db as assertions', () => {
  const asserted = lintJourney({
    journey: journey([
      { call: { endpoint: 'tickets-add-comment', payload: { ticket_id: 'T-1' } } },
      { expect: { status: 403 } },
      { request: { pageId: 'tickets', requestId: 'get_ticket', as: 'client_b' } },
      { expect: { error: 'Ticket not found.' } },
      { expect: { db: { collection: 'log-events', match: { ticket_ids: 'T-1' }, count: 0 } } },
    ]),
    exercisedEntry: entry(),
  });
  expect(rules(asserted, 'L2')).toEqual([]);
  expect(rules(asserted, 'L6')).toEqual([]);
  const unasserted = lintJourney({
    journey: journey([
      { call: { endpoint: 'tickets-add-comment' } },
      { request: { pageId: 'tickets', requestId: 'get_ticket' } },
    ]),
    exercisedEntry: entry(),
  });
  expect(rules(unasserted, 'L2').map(({ message }) => message)).toEqual([
    'step 0 (call "tickets-add-comment") is not followed by an expect or wait: { request } before step 1.',
    'step 1 (request "get_ticket" on "tickets") is not followed by an expect or wait: { request } before the journey ends.',
  ]);
  expect(rules(unasserted, 'L6').map(({ message }) => message)).toEqual([
    'the last step, step 1 (request "get_ticket" on "tickets"), is not an expect or wait: { request }.',
  ]);
});

test('L8 reports a target that reads the page on a block it already names, with the blockId to use', () => {
  const problems = lintJourney({
    journey: journey([
      { click: { blockId: 'assign_button', text: 'Assign' } },
      { expect: { visible: { blockId: 'assigned_alert', containing: 'Assigned' } } },
    ]),
    exercisedEntry: entry(),
  });
  expect(rules(problems, 'L8')).toEqual([
    {
      rule: 'L8',
      severity: 'warning',
      stepIndex: 0,
      message:
        'step 0 (click "assign_button") names block "assign_button" and reads the page for its text: target { blockId: assign_button } alone, which runs headless without reading the page.',
    },
    {
      rule: 'L8',
      severity: 'warning',
      stepIndex: 1,
      message:
        'step 1 (expect: { visible }) names block "assigned_alert" and reads the page for its containing: target { blockId: assigned_alert } alone, which runs headless without reading the page.',
    },
  ]);
});

test('L8 does not report a journey that a check of what the person sees keeps in the browser', () => {
  const problems = lintJourney({
    journey: journey([
      { click: { blockId: 'assign_button', text: 'Assign' } },
      { expect: { text: { blockId: 'assigned_alert', contains: 'Assigned' } } },
    ]),
    exercisedEntry: entry(),
  });
  expect(rules(problems, 'L8')).toEqual([]);
});

test('L8 still says a journey a grid row keeps in the browser runs headless with the control its run clicked', () => {
  const steps = [
    { click: { blockId: 'issue_cards', control: 'onOpenIssue', rowKey: 'issue-17' } },
    { click: { blockId: 'grid', row: 0 } },
  ];
  const controls = [{ stepIndex: 1, blockId: 'grid', control: 'edit', rowKey: 'row-1' }];
  const problems = lintJourney({ journey: journey(steps), exercisedEntry: entry({ controls }) });
  expect(rules(problems, 'L8').map(({ message }) => message)).toEqual([
    'step 1 (click "grid") names block "grid" and reads the page for its row: target { blockId: grid, control: edit, rowKey: row-1 }, the control its measured run clicked, and the journey runs headless.',
  ]);
});

test('L8 does not report a page-wide text target, a grid target or a journey that runs headless', () => {
  const lint = (steps) =>
    rules(lintJourney({ journey: journey(steps), exercisedEntry: entry() }), 'L8');
  expect(lint([{ click: { text: 'Assign' } }])).toEqual([]);
  expect(lint([{ click: { blockId: 'grid', row: 0, text: 'Open' } }])).toEqual([]);
  expect(lint([{ click: 'assign_button' }, { expect: { visible: 'assigned_alert' } }])).toEqual([]);
});

test('L8 suggests the control its measured run clicked for a click that reads the page', () => {
  const steps = [
    { click: { blockId: 'issue_cards', containing: 'micromatch 4.0.5: 1 advisory' } },
    { expect: { db: { collection: 'issues', connectionId: 'db', match: {}, equals: [] } } },
    { click: { blockId: 'pairs', text: 'Merge', nth: 0 } },
    { click: { text: 'OK' } },
  ];
  const controls = [
    { stepIndex: 0, blockId: 'issue_cards', control: 'onOpenIssue', rowKey: 'issue-17' },
    { stepIndex: 2, blockId: 'pairs', control: 'onMerge', rowKey: 'pair-1' },
    { stepIndex: 3, blockId: 'pairs', control: 'ok', rowKey: null },
  ];
  const problems = lintJourney({ journey: journey(steps), exercisedEntry: entry({ controls }) });
  expect(rules(problems, 'L8').map(({ message }) => message)).toEqual([
    'step 0 (click "issue_cards") names block "issue_cards" and reads the page for its containing: target { blockId: issue_cards, control: onOpenIssue, rowKey: issue-17 }, the control its measured run clicked, which runs headless without reading the page.',
    'step 2 (click "pairs") names block "pairs" and reads the page for its text and nth: target { blockId: pairs, control: onMerge, rowKey: pair-1 }, the control its measured run clicked, which runs headless without reading the page.',
    'step 3 (click "OK") reads the page for its text: target { blockId: pairs, control: ok }, the control its measured run clicked, which runs headless without reading the page.',
  ]);
});

test('L8 falls back to the blockId alone where no control was recorded, and reports nothing when a step stays in the browser', () => {
  const steps = [
    { click: { blockId: 'issue_cards', containing: 'micromatch' } },
    { click: { blockId: 'other_list', containing: 'Archive' } },
    { expect: { db: { collection: 'issues', connectionId: 'db', match: {}, equals: [] } } },
  ];
  const controls = [
    { stepIndex: 0, blockId: 'issue_cards', control: 'onOpenIssue', rowKey: 'issue-17' },
  ];
  const problems = lintJourney({ journey: journey(steps), exercisedEntry: entry({ controls }) });
  expect(rules(problems, 'L8').map(({ message }) => message)).toEqual([
    'step 0 (click "issue_cards") names block "issue_cards" and reads the page for its containing: target { blockId: issue_cards, control: onOpenIssue, rowKey: issue-17 }, the control its measured run clicked, which runs headless without reading the page.',
    'step 1 (click "other_list") names block "other_list" and reads the page for its containing: target { blockId: other_list } alone, which runs headless without reading the page.',
  ]);
  const withRow = [
    { click: { blockId: 'issue_cards', containing: 'micromatch' } },
    { expect: { visible: { blockId: 'grid', row: 0 } } },
  ];
  expect(
    rules(lintJourney({ journey: journey(withRow), exercisedEntry: entry({ controls }) }), 'L8')
  ).toEqual([]);
});

test('L8 never offers the blockId alone for expect.hidden by text, which would check the opposite', () => {
  const problems = lintJourney({
    journey: journey([
      { click: { blockId: 'assign_button', text: 'Assign' } },
      { expect: { hidden: { blockId: 'issue_cards', containing: 'micromatch' } } },
    ]),
    exercisedEntry: entry(),
  });
  expect(rules(problems, 'L8').map(({ stepIndex }) => stepIndex)).toEqual([0]);
});
