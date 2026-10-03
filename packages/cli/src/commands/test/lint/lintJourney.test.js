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

function journey(steps, extra = {}) {
  return { name: 'assigns a ticket', pageId: 'tickets', steps, ...extra };
}

function entry({ events = [], requests = [], endpoints = [] } = {}) {
  return {
    hash: 'h',
    passed: true,
    exercised: { pages: ['tickets'], appEvents: true, requests, endpoints, events, rendered: {} },
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

test('a compiled candidate, with event-less clicks and a final wait for a request, lints clean', () => {
  const problems = lintJourney({
    journey: journey([
      { click: 'tab_header' },
      { fill: { blockId: 'title', value: 'Printer jam', from: 'recorded' } },
      { click: 'assign_submit' },
      { wait: { request: 'assign' } },
    ]),
    exercisedEntry: entry({ events: [event('assign_submit')] }),
  });
  expect(problems).toEqual([]);
});
