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
import { expect, test } from 'vitest';

// Every step error ends with examples of the step; a test of the rule a
// message names compares the message without them.
const EXAMPLES = / Example: .*$/;

test('validateJourneySteps accepts every step of the grammar', () => {
  const result = validateJourneySteps({
    steps: [
      { click: 'submit' },
      { open: 'status' },
      { open: { blockId: 'status', nth: 0 } },
      { fill: { blockId: 'name', value: 'Ada' } },
      { fill: { blockId: 'age', value: 0 } },
      { select: { blockId: 'country', value: 'Chile' } },
      { press: 'Mod+k' },
      { back: true },
      { back: null },
      { goto: 'dashboard' },
      { goto: { pageId: 'invoice' } },
      { goto: { pageId: 'invoice', urlQuery: { id: 'inv-1' } } },
      { goto: { pageId: 'ticket', pathParams: { space: 's', ticket_id: '1' } } },
      { email: { to: 'ada@example.test' } },
      { email: { to: 'ada@example.test', subject: 'Verify' } },
      { fill: { blockId: 'otp', fromEmail: { to: 'ada@example.test', match: '\\b\\d{6}\\b' } } },
      {
        fill: {
          blockId: 'otp',
          fromEmail: { to: 'ada@example.test', subject: 'Your sign-in link', match: 'code (\\d+)' },
        },
      },
      { as: 'invitee' },
      { wait: { ms: 100 } },
      { wait: 3000 },
      { wait: { request: 'get_rows' } },
      { wait: { state: 'rows' } },
      { screenshot: 'after' },
      { screenshot: true },
      { screenshot: null },
      { expect: { state: { path: 'saved', equals: true } } },
      { expect: { state: { path: 'missing', equals: null } } },
      { expect: { visible: 'modal' } },
      { expect: { text: { blockId: 'title', contains: 'Hello' } } },
      { expect: { url: { contains: '/detail' } } },
      { expect: { title: { equals: 'Tasks' } } },
      { expect: { title: { contains: 'Task' } } },
    ],
  });
  expect(result).toEqual({});
});

test('validateJourneySteps accepts target objects on click, fill, select, expect.visible and expect.text', () => {
  const result = validateJourneySteps({
    steps: [
      { click: { blockId: 'submit' } },
      { click: { blockId: 'grid', row: 1, text: 'Edit' } },
      { click: { blockId: 'grid', row: 0, column: 'actions' } },
      { click: { blockId: 'grid', row: 0, column: 'actions', nth: 1 } },
      { click: { blockId: 'tabs', text: 'Settings' } },
      { click: { blockId: 'members_list', containing: 'ada@example.test' } },
      { click: { containing: 'Invitation sent' } },
      { expect: { visible: { blockId: 'members_list', containing: 'Owner' } } },
      { click: { text: 'OK' } },
      { click: { text: 'Delete', nth: 0 } },
      { fill: { blockId: 'grid', row: 2, column: 'name', value: 'Ada' } },
      { select: { blockId: 'grid', row: 2, column: 'status', value: 'Open' } },
      { expect: { visible: { blockId: 'grid', row: 3 } } },
      { expect: { visible: { text: 'Are you sure?' } } },
      { expect: { text: { blockId: 'grid', row: 0, column: 'title', contains: 'Access' } } },
      { expect: { text: { blockId: 'grid', row: 0, contains: 'Access' } } },
    ],
  });
  expect(result).toEqual({});
});

test('validateJourneySteps rejects steps that are not an array', () => {
  expect(validateJourneySteps({ steps: undefined }).error).toMatch(
    /requires "steps" to be an array. Received undefined/
  );
  expect(validateJourneySteps({ steps: 'click' }).error).toMatch(/Received "click"/);
});

test('validateJourneySteps names the index and key of an unknown step', () => {
  const result = validateJourneySteps({ steps: [{ click: 'a' }, { hover: 'b' }] });
  expect(result.error).toEqual(
    'Step 1: Unknown journey step "hover". Steps are: click, open, fill, select, press, back, goto, email, as, wait, screenshot, expect, call, request.'
  );
});

test('validateJourneySteps rejects a step with more than one key', () => {
  const result = validateJourneySteps({ steps: [{ click: 'a', fill: { blockId: 'b' } }] });
  expect(result.error).toEqual(
    'Step 0: Unknown journey step "click, fill". Steps are: click, open, fill, select, press, back, goto, email, as, wait, screenshot, expect, call, request.'
  );
});

test('validateJourneySteps rejects a step that is not an object', () => {
  expect(validateJourneySteps({ steps: ['click submit'] }).error).toMatch(
    /Step 0: Journey steps must be objects with one key. Received "click submit"/
  );
});

test.each([
  [{ click: 7 }, /Step "click" requires a blockId string or a target object .*Received 7/],
  [{ click: {} }, /Step "click" requires a "blockId", a "text" or a "containing" to target/],
  [{ click: { blockId: 7 } }, /Step "click" requires "blockId" to be a string. Received 7/],
  [{ click: { text: 7 } }, /Step "click" requires "text" to be a string. Received 7/],
  [
    { click: { blockId: 'grid', row: -1 } },
    /Step "click" requires "row" to be a zero-based row index. Received -1/,
  ],
  [
    { click: { blockId: 'grid', row: '0' } },
    /Step "click" requires "row" to be a zero-based row index. Received "0"/,
  ],
  [
    { click: { blockId: 'grid', column: 0 } },
    /Step "click" requires "column" to be a column id string. Received 0/,
  ],
  [
    { click: { text: 'Edit', row: 0 } },
    /Step "click" requires a "blockId" \(the grid block\) when "row" or "column" is given/,
  ],
  [
    { click: { text: 'Edit', column: 'actions' } },
    /Step "click" requires a "blockId" \(the grid block\) when "row" or "column" is given/,
  ],
  [
    { click: { text: 'Edit', nth: 1.5 } },
    /Step "click" requires "nth" to be a zero-based index. Received 1.5/,
  ],
  [
    { click: { blockId: 'grid', colum: 'actions' } },
    /Step "click" has unknown key "colum". Keys are: blockId, text, containing, row, column, nth/,
  ],
  [
    { click: { blockId: 'grid', colum: 'a', rows: 1 } },
    /Step "click" has unknown keys "colum", "rows"/,
  ],
  [{ fill: 'name' }, /Step "fill" requires \{ blockId, value \}/],
  [
    { fill: { blockId: 1, value: 'x' } },
    /Step "fill" requires "blockId" to be a string. Received 1/,
  ],
  [{ fill: { value: 'x' } }, /Step "fill" requires a "blockId" string/],
  [{ fill: { text: 'Name', value: 'x' } }, /Step "fill" requires a "blockId" string/],
  [
    { fill: { blockId: 'grid', row: 0, column: 'name', value: 'x', selector: 'input' } },
    /Step "fill" has unknown key "selector". Keys are: blockId, text, containing, row, column, nth, value/,
  ],
  [{ fill: { blockId: 'name' } }, /Step "fill" requires a "value"/],
  [{ select: { value: 'x' } }, /Step "select" requires a "blockId" string/],
  [{ press: ['Enter'] }, /Step "press" requires a key string/],
  [{ wait: '100' }, /Step "wait" requires one of \{ ms \}, \{ request \}, \{ state \}/],
  [
    { wait: { ms: 1, request: 'r' } },
    /Step "wait" requires exactly one of "ms", "request", "state"/,
  ],
  [{ wait: { until: 'x' } }, /Step "wait" requires exactly one of/],
  [{ wait: { ms: '100' } }, /Step "wait" requires "ms" to be a number. Received "100"/],
  [{ wait: { request: 1 } }, /Step "wait" requires "request" to be a string. Received 1/],
  [{ screenshot: 3 }, /Step "screenshot" takes an optional name string. Received 3/],
  [
    { expect: 'visible' },
    /Step "expect" requires one of \{ state \}, \{ visible \}, \{ hidden \}, \{ text \}, \{ url \}, \{ title \}, \{ calls \}/,
  ],
  [
    { expect: { count: 1 } },
    /Step "expect" requires exactly one of "state", "visible", "hidden", "text", "url", "title", "calls", "error"/,
  ],
  [{ expect: { state: { path: 'a' } } }, /Step "expect.state" requires \{ path, equals \}/],
  [{ expect: { state: 'a' } }, /Step "expect.state" requires \{ path, equals \}/],
  [
    { expect: { visible: 7 } },
    /Step "expect.visible" requires a blockId string or a target object/,
  ],
  [
    { expect: { visible: { row: 0 } } },
    /Step "expect.visible" requires a "blockId", a "text" or a "containing" to target/,
  ],
  [{ expect: { text: { blockId: 'a' } } }, /Step "expect.text" requires \{ blockId, contains \}/],
  [
    { expect: { text: { text: 'OK', contains: 'OK' } } },
    /Step "expect.text" requires a "blockId" string/,
  ],
  [
    { expect: { text: { blockId: 'grid', row: 0, contains: 'a', equals: 'a' } } },
    /Step "expect.text" has unknown key "equals". Keys are: blockId, text, containing, row, column, nth, contains/,
  ],
  [{ expect: { url: '/detail' } }, /Step "expect.url" requires \{ contains \}/],
  [{ back: 'home' }, /Step "back" takes no value: write \{ "back": true \}. Received "home"/],
  [{ back: false }, /Step "back" takes no value/],
  [{ expect: { title: 'Tasks' } }, /Step "expect.title" requires \{ equals \} or \{ contains \}/],
  [
    { expect: { title: { equals: 'Tasks', contains: 'T' } } },
    /Step "expect.title" requires \{ equals \} or \{ contains \}/,
  ],
  [{ expect: { title: { equals: 7 } } }, /Step "expect.title" requires .* Received \{"equals":7\}/],
  [{ expect: { title: { is: 'Tasks' } } }, /Step "expect.title" requires/],
  [
    { goto: '' },
    /Step "goto" requires a pageId string or \{ pageId, pathParams, urlQuery \}. Received ""/,
  ],
  [
    { goto: 7 },
    /Step "goto" requires a pageId string or \{ pageId, pathParams, urlQuery \}. Received 7/,
  ],
  [{ goto: { urlQuery: { id: 1 } } }, /Step "goto" requires a "pageId" string. Received undefined/],
  [
    { goto: { pageId: 'invoice', urlQuery: 'id=1' } },
    /Step "goto" requires "urlQuery" to be an object. Received "id=1"/,
  ],
  [
    { goto: { pageId: 'ticket', pathParams: 'tickets/s/1' } },
    /Step "goto" requires "pathParams" to be an object of strings, one per path placeholder. Received "tickets\/s\/1"/,
  ],
  [
    { goto: { pageId: 'ticket', pathParams: { ticket_id: 1 } } },
    /Step "goto" requires "pathParams" to be an object of strings, one per path placeholder. Received \{"ticket_id":1\}/,
  ],
  [
    { goto: { pageId: 'invoice', url: '/invoice' } },
    /Step "goto" has unknown key "url". Keys are: pageId, pathParams, urlQuery/,
  ],
  [{ email: 'ada@example.test' }, /Step "email" requires \{ to, subject \}/],
  [{ email: { subject: 'Verify' } }, /Step "email" requires a "to" address string/],
  [{ email: { to: '' } }, /Step "email" requires a "to" address string. Received ""/],
  [
    { email: { to: 'ada@example.test', subject: 7 } },
    /Step "email" requires "subject" to be a string. Received 7/,
  ],
  [
    { email: { to: 'ada@example.test', subjet: 'Verify' } },
    /Step "email" has unknown key "subjet". Keys are: to, subject/,
  ],
  [
    { fill: { blockId: 'otp', value: '1', fromEmail: { to: 'ada@example.test', match: '\\d' } } },
    /Step "fill" takes a "value" or a "fromEmail", not both/,
  ],
  [
    { fill: { fromEmail: { to: 'ada@example.test', match: '\\d' } } },
    /Step "fill" requires a "blockId" string/,
  ],
  [
    { fill: { blockId: 'otp', fromEmail: 'ada@example.test' } },
    /Step "fill" requires "fromEmail" to be \{ to, subject, match \}/,
  ],
  [
    { fill: { blockId: 'otp', fromEmail: { match: '\\d' } } },
    /Step "fill.fromEmail" requires a "to" address string. Received undefined/,
  ],
  [
    { fill: { blockId: 'otp', fromEmail: { to: 'ada@example.test' } } },
    /Step "fill.fromEmail" requires a "match" regular expression string/,
  ],
  [
    { fill: { blockId: 'otp', fromEmail: { to: 'ada@example.test', match: '(' } } },
    /Step "fill.fromEmail" requires "match" to be a valid regular expression/,
  ],
  [
    { fill: { blockId: 'otp', fromEmail: { to: 'ada@example.test', match: '\\d', subject: 1 } } },
    /Step "fill.fromEmail" requires "subject" to be a string. Received 1/,
  ],
  [
    { fill: { blockId: 'otp', fromEmail: { to: 'ada@example.test', pattern: '\\d' } } },
    /Step "fill.fromEmail" has unknown key "pattern". Keys are: to, subject, match/,
  ],
  [
    { click: { blockId: 'members_list', containing: '' } },
    /Step "click" requires "containing" to be a non-empty string. Received ""/,
  ],
  [
    { click: { blockId: 'members_list', text: 'Edit', containing: 'ada' } },
    /Step "click" takes "text" \(a control's exact text\) or "containing"/,
  ],
  [{ as: '' }, /Step "as" requires an actor name string/],
  [{ as: { name: 'invitee' } }, /Step "as" requires an actor name string/],
])('validateJourneySteps rejects malformed step %j', (step, expected) => {
  const result = validateJourneySteps({ steps: [step] });
  expect(result.error).toMatch(/^Step 0: /);
  expect(result.error).toMatch(expected);
});

test('validateJourneySteps rejects an open step with no target', () => {
  expect(validateJourneySteps({ steps: [{ open: 5 }] }).error).toMatch(/Step "open" requires/);
});

test('validateJourneySteps accepts from recorded and from shape on fill, select and expect.state', () => {
  expect(
    validateJourneySteps({
      steps: [
        { fill: { blockId: 'title', value: 'Ada', from: 'recorded' } },
        { fill: { blockId: 'title', value: null, from: 'shape' } },
        { select: { blockId: 'owner', value: 'Grace', from: 'recorded' } },
        { select: { blockId: 'owner', value: null, from: 'shape' } },
        { expect: { state: { path: 'title', equals: 'Ada', from: 'recorded' } } },
        { expect: { state: { path: 'title', equals: null, from: 'shape' } } },
      ],
    })
  ).toEqual({});
});

test('validateJourneySteps rejects from on click, press and wait', () => {
  expect(
    validateJourneySteps({ steps: [{ click: { blockId: 'a', from: 'recorded' } }] }).error.replace(
      EXAMPLES,
      ''
    )
  ).toBe(
    'Step 0: Step "click" has unknown key "from". Keys are: blockId, text, containing, row, column, nth, count.'
  );
  expect(
    validateJourneySteps({ steps: [{ press: { key: 'Enter', from: 'recorded' } }] }).error.replace(
      EXAMPLES,
      ''
    )
  ).toBe(
    'Step 0: Step "press" requires a key string such as "Enter" or "Mod+k". Received {"key":"Enter","from":"recorded"}.'
  );
  expect(
    validateJourneySteps({ steps: [{ wait: { request: 'r', from: 'recorded' } }] }).error.replace(
      EXAMPLES,
      ''
    )
  ).toBe(
    'Step 0: Step "wait" requires exactly one of "ms", "request", "state". Received {"request":"r","from":"recorded"}.'
  );
});

test('validateJourneySteps rejects a from value other than recorded or shape', () => {
  expect(
    validateJourneySteps({
      steps: [{ fill: { blockId: 'a', value: 'x', from: 'guess' } }],
    }).error.replace(EXAMPLES, '')
  ).toBe('Step 0: Step "fill" requires "from" to be one of "recorded", "shape". Received "guess".');
  expect(
    validateJourneySteps({
      steps: [{ expect: { state: { path: 'a', equals: 1, from: 'guess' } } }],
    }).error.replace(EXAMPLES, '')
  ).toBe(
    'Step 0: Step "expect.state" requires "from" to be one of "recorded", "shape". Received "guess".'
  );
});

test('validateJourneySteps rejects a null fill or select value without from shape', () => {
  expect(
    validateJourneySteps({ steps: [{ fill: { blockId: 'a', value: null } }] }).error.replace(
      EXAMPLES,
      ''
    )
  ).toBe(
    'Step 0: Step "fill" requires a non-null "value"; a placeholder value: null is marked from: shape. Received {"blockId":"a","value":null}.'
  );
  expect(
    validateJourneySteps({ steps: [{ select: { blockId: 'a', value: null, from: 'recorded' } }] })
      .error
  ).toContain('Step 0: Step "select" requires a non-null "value"');
});

test('validateJourneySteps keeps the equals requirement on expect.state with from shape', () => {
  expect(
    validateJourneySteps({
      steps: [{ expect: { state: { path: 'a', from: 'shape' } } }],
    }).error.replace(EXAMPLES, '')
  ).toBe(
    'Step 0: Step "expect.state" requires { path, equals }. Received {"path":"a","from":"shape"}.'
  );
});

test('validateJourneySteps accepts expect.hidden, expect.calls and click.count', () => {
  expect(
    validateJourneySteps({
      steps: [
        { expect: { hidden: 'error_alert' } },
        { expect: { hidden: { blockId: 'tickets', containing: 'Other org ticket' } } },
        { expect: { calls: { request: 'save', pageId: 'tickets', count: 1 } } },
        { expect: { calls: { request: 'save', count: 0 } } },
        { expect: { calls: { endpoint: 'notify', count: 2 } } },
        { click: { blockId: 'submit', count: 2 } },
        { click: { text: 'Save', count: 1 } },
        { click: { blockId: 'submit', count: 3 } },
      ],
    })
  ).toEqual({});
});

test('validateJourneySteps rejects malformed expect.hidden', () => {
  expect(validateJourneySteps({ steps: [{ expect: { hidden: 3 } }] }).error).toContain(
    'Step 0: Step "expect.hidden" requires a blockId string or a target object'
  );
  expect(validateJourneySteps({ steps: [{ expect: { hidden: { colum: 'a' } } }] }).error).toContain(
    'Step "expect.hidden" has unknown key "colum"'
  );
});

test('validateJourneySteps rejects malformed expect.calls', () => {
  function error(calls) {
    return validateJourneySteps({ steps: [{ expect: { calls } }] }).error.replace(EXAMPLES, '');
  }
  expect(error({ request: 'save', endpoint: 'notify', count: 1 })).toBe(
    'Step 0: Step "expect.calls" requires exactly one of "request" or "endpoint". Received {"request":"save","endpoint":"notify","count":1}.'
  );
  expect(error({ count: 1 })).toContain('requires exactly one of "request" or "endpoint"');
  expect(error({ endpoint: 'notify', pageId: 'tickets', count: 1 })).toBe(
    'Step 0: Step "expect.calls" has unknown key "pageId". Keys are: endpoint, count, payload, response.'
  );
  expect(error({ request: 'save', count: -1 })).toBe(
    'Step 0: Step "expect.calls" requires "count" to be a whole number of calls, 0 or more. Received -1.'
  );
  expect(error({ request: 'save', count: 1.5 })).toContain('requires "count" to be a whole number');
  expect(error({ request: 'save' })).toContain('requires "count" to be a whole number');
  expect(error({ request: '', count: 1 })).toContain('requires "request" to be a non-empty string');
  expect(error({ request: 'save', pageId: 4, count: 1 })).toContain(
    'requires "pageId" to be a non-empty string'
  );
  expect(error('save')).toContain('Step "expect.calls" requires { request, pageId?, count }');
});

test('validateJourneySteps rejects a click count outside 1 to 3', () => {
  expect(
    validateJourneySteps({ steps: [{ click: { blockId: 'a', count: 0 } }] }).error.replace(
      EXAMPLES,
      ''
    )
  ).toBe('Step 0: Step "click" requires "count" to be 1, 2 or 3. Received 0.');
  expect(
    validateJourneySteps({ steps: [{ click: { blockId: 'a', count: 4 } }] }).error.replace(
      EXAMPLES,
      ''
    )
  ).toBe('Step 0: Step "click" requires "count" to be 1, 2 or 3. Received 4.');
  expect(
    validateJourneySteps({ steps: [{ click: { blockId: 'a', count: '2' } }] }).error.replace(
      EXAMPLES,
      ''
    )
  ).toBe('Step 0: Step "click" requires "count" to be 1, 2 or 3. Received "2".');
  // count belongs to click alone.
  expect(validateJourneySteps({ steps: [{ open: { blockId: 'a', count: 2 } }] }).error).toContain(
    'Step "open" has unknown key "count"'
  );
});

test('validateJourneySteps rejects an unknown key on expect.state', () => {
  expect(
    validateJourneySteps({
      steps: [{ expect: { state: { path: 'a', equals: null, form: 'shape' } } }],
    }).error.replace(EXAMPLES, '')
  ).toBe('Step 0: Step "expect.state" has unknown key "form". Keys are: path, equals, from.');
  expect(
    validateJourneySteps({
      steps: [{ expect: { state: { path: 'a', equals: 1, value: 1, eq: 1 } } }],
    }).error.replace(EXAMPLES, '')
  ).toBe(
    'Step 0: Step "expect.state" has unknown keys "value", "eq". Keys are: path, equals, from.'
  );
});

test('validateJourneySteps accepts path, equals and from on expect.state', () => {
  expect(
    validateJourneySteps({
      steps: [
        { expect: { state: { path: 'a', equals: 1 } } },
        { expect: { state: { path: 'a', equals: 1, from: 'recorded' } } },
      ],
    })
  ).toEqual({});
});

test('validateJourneySteps accepts expect.error straight after an interaction step', () => {
  expect(
    validateJourneySteps({
      steps: [
        { fill: { blockId: 'email', value: 'taken@example.com' } },
        { click: 'save' },
        { expect: { error: 'duplicate key' } },
        { expect: { visible: 'already_exists' } },
      ],
    })
  ).toEqual({});
});

test.each([
  [{ error: '' }, 'Step 1: Step "expect.error" requires a non-empty string'],
  [{ error: 7 }, 'Received 7.'],
  [{ error: { contains: 'x' } }, 'Received {"contains":"x"}.'],
])('validateJourneySteps rejects expect %j', (expectation, message) => {
  const result = validateJourneySteps({ steps: [{ click: 'save' }, { expect: expectation }] });
  expect(result.error).toContain(message);
});

test('validateJourneySteps rejects an expect.error that does not follow an interaction step', () => {
  expect(
    validateJourneySteps({
      steps: [{ click: 'save' }, { wait: { ms: 10 } }, { expect: { error: 'x' } }],
    }).error
  ).toEqual(
    'Step 2: Step "expect.error" must directly follow an interaction step (click, open, fill, select, press, back), whose app errors it claims. Received it after a "wait" step.'
  );
  expect(validateJourneySteps({ steps: [{ expect: { error: 'x' } }] }).error).toEqual(
    'Step 0: Step "expect.error" must directly follow an interaction step (click, open, fill, select, press, back), whose app errors it claims. Received it after the start of the journey.'
  );
});

test('validateJourneySteps accepts expect.effect straight after an interaction step', () => {
  expect(
    validateJourneySteps({
      steps: [{ click: 'save' }, { expect: { effect: true } }],
    })
  ).toEqual({});
  expect(
    validateJourneySteps({
      steps: [{ fill: { blockId: 'name', value: 'x' } }, { expect: { effect: true } }],
    })
  ).toEqual({});
});

test.each([
  [{ effect: false }, 'Received false.'],
  [{ effect: 'yes' }, 'Received "yes".'],
  [{ effect: { blockId: 'save' } }, 'Received {"blockId":"save"}.'],
])('validateJourneySteps rejects expect %j', (expectation, message) => {
  const result = validateJourneySteps({ steps: [{ click: 'save' }, { expect: expectation }] });
  expect(result.error.replace(EXAMPLES, '')).toBe(
    `Step 1: Step "expect.effect" takes only true: write { "expect": { "effect": true } }. ${message}`
  );
});

test('validateJourneySteps rejects an expect.effect that does not follow an interaction step', () => {
  expect(validateJourneySteps({ steps: [{ expect: { effect: true } }] }).error).toEqual(
    'Step 0: Step "expect.effect" must directly follow an interaction step (click, open, fill, select, press, back), whose effect it checks. Received it after the start of the journey.'
  );
  expect(
    validateJourneySteps({
      steps: [{ click: 'save' }, { expect: { visible: 'saved' } }, { expect: { effect: true } }],
    }).error
  ).toEqual(
    'Step 2: Step "expect.effect" must directly follow an interaction step (click, open, fill, select, press, back), whose effect it checks. Received it after a "expect" step.'
  );
  expect(
    validateJourneySteps({
      steps: [{ click: 'save' }, { screenshot: true }, { expect: { effect: true } }],
    }).error
  ).toContain('Received it after a "screenshot" step.');
});

test('validateJourneySteps ends a step error with examples of that step', () => {
  expect(validateJourneySteps({ steps: [{ wait: '3s' }] }).error).toBe(
    'Step 0: Step "wait" requires one of { ms }, { request }, { state }. Received "3s". Example: {"wait":{"request":"get_orders"}} or {"wait":{"state":"orders"}} or {"wait":{"ms":500}}.'
  );
  expect(validateJourneySteps({ steps: [{ goto: { path: 'orders' } }] }).error).toMatch(
    /Example: \{"goto":"dashboard"\} or \{"goto":\{"pageId":"ticket",/
  );
});

test('validateJourneySteps ends an expect error with examples of that expect kind', () => {
  expect(
    validateJourneySteps({ steps: [{ expect: { text: { blockId: 'title' } } }] }).error
  ).toMatch(/ Example: \{"expect":\{"text":\{"blockId":"title","contains":"Orders"\}\}\}\.$/);
  expect(validateJourneySteps({ steps: [{ expect: { count: 1 } }] }).error).toMatch(
    / Example: \{"expect":\{"visible":"save_button"\}\} or \{"expect":\{"url":\{"contains":"\/orders"\}\}\}\.$/
  );
});

test('validateJourneySteps lists the valid step names for an unknown step', () => {
  expect(validateJourneySteps({ steps: [{ browser_forward: true }] }).error).toBe(
    'Step 0: Unknown journey step "browser_forward". Steps are: click, open, fill, select, press, back, goto, email, as, wait, screenshot, expect, call, request.'
  );
});

test('validateJourneySteps accepts call and request, with payload and as', () => {
  expect(
    validateJourneySteps({
      steps: [
        { call: { endpoint: 'tickets-add-comment' } },
        {
          call: { endpoint: 'tickets-add-comment', payload: { ticket_id: 'T-1' }, as: 'client_b' },
        },
        { call: { endpoint: 'tickets-list', as: 'none' } },
        { call: { endpoint: 'tickets-list', as: { roles: ['admin'] } } },
        { request: { pageId: 'ticket', requestId: 'get_ticket' } },
        { request: { pageId: 'ticket', requestId: 'get_ticket', payload: { _id: { $ne: null } } } },
        { expect: { status: 200 } },
      ],
    })
  ).toEqual({});
});

test('validateJourneySteps rejects malformed call and request steps', () => {
  function error(step) {
    return validateJourneySteps({ steps: [step] }).error.replace(EXAMPLES, '');
  }
  expect(error({ call: 'tickets-list' })).toBe(
    'Step 0: Step "call" requires { endpoint, payload?, as? }. Received "tickets-list".'
  );
  expect(error({ call: { endpoint: '' } })).toBe(
    'Step 0: Step "call" requires "endpoint" to be a non-empty string. Received "".'
  );
  expect(error({ call: { endpoint: 'e', pageId: 'p' } })).toBe(
    'Step 0: Step "call" has unknown key "pageId". Keys are: endpoint, payload, as.'
  );
  expect(error({ call: { endpoint: 'e', payload: 'x' } })).toBe(
    'Step 0: Step "call" requires "payload" to be an object. Received "x".'
  );
  expect(error({ call: { endpoint: 'e', as: ['a', 'b'] } })).toBe(
    'Step 0: Step "call" requires "as" to be a data set user\'s name, "none" to call signed out, or an inline user object. Received ["a","b"].'
  );
  expect(error({ call: { endpoint: 'e', as: '' } })).toContain('Step "call" requires "as" to be');
  expect(error({ call: { endpoint: 'e', as: 3 } })).toContain('Received 3.');
  expect(error({ request: { requestId: 'get_ticket' } })).toBe(
    'Step 0: Step "request" requires "pageId" to be a non-empty string. Received undefined.'
  );
  expect(error({ request: { pageId: 'ticket' } })).toBe(
    'Step 0: Step "request" requires "requestId" to be a non-empty string. Received undefined.'
  );
  expect(error({ request: [] })).toBe(
    'Step 0: Step "request" requires { pageId, requestId, payload?, as? }. Received [].'
  );
  expect(validateJourneySteps({ steps: [{ request: {} }] }).error).toMatch(
    / Example: \{"request":\{"pageId":"orders","requestId":"get_order"/
  );
});

test('validateJourneySteps accepts expect.status and expect.error after a call or request, with expects between', () => {
  expect(
    validateJourneySteps({
      steps: [
        { call: { endpoint: 'tickets-add-comment' } },
        { expect: { status: 404 } },
        { expect: { error: 'Ticket not found.' } },
        { expect: { db: { collection: 'log-events', match: {}, count: 0 } } },
        { expect: { status: 404 } },
        { request: { pageId: 'ticket', requestId: 'get_ticket' } },
        { expect: { error: 'Not allowed.' } },
      ],
    })
  ).toEqual({});
});

test('validateJourneySteps rejects an expect.status with no call or request before it', () => {
  expect(validateJourneySteps({ steps: [{ expect: { status: 403 } }] }).error).toBe(
    'Step 0: Step "expect.status" must follow a "call" or "request" step, whose answer it reads; only expect steps may sit between them. Received it after the start of the journey.'
  );
  expect(
    validateJourneySteps({
      steps: [{ call: { endpoint: 'e' } }, { click: 'save' }, { expect: { status: 403 } }],
    }).error
  ).toBe(
    'Step 2: Step "expect.status" must follow a "call" or "request" step, whose answer it reads; only expect steps may sit between them. Received it after a "click" step.'
  );
  expect(
    validateJourneySteps({
      steps: [{ call: { endpoint: 'e' } }, { wait: { ms: 10 } }, { expect: { error: 'x' } }],
    }).error
  ).toContain('Step 2: Step "expect.error" must directly follow an interaction step');
  expect(
    validateJourneySteps({ steps: [{ call: { endpoint: 'e' } }, { expect: { effect: true } }] })
      .error
  ).toContain('Step 1: Step "expect.effect" must directly follow an interaction step');
});

test.each([
  [{ status: '403' }, 'Received "403".'],
  [{ status: 99 }, 'Received 99.'],
  [{ status: 600 }, 'Received 600.'],
  [{ status: 403.5 }, 'Received 403.5.'],
])('validateJourneySteps rejects expect %j', (expectation, message) => {
  const result = validateJourneySteps({
    steps: [{ call: { endpoint: 'e' } }, { expect: expectation }],
  });
  expect(result.error).toContain(
    'Step 1: Step "expect.status" requires an HTTP status code, a whole number from 100 to 599, e.g. 403.'
  );
  expect(result.error).toContain(message);
});

test('validateJourneySteps accepts expect.calls with payload or response in place of count', () => {
  expect(
    validateJourneySteps({
      steps: [
        { expect: { calls: { request: 'save', payload: { status: 'Open' } } } },
        { expect: { calls: { request: 'save', pageId: 'orders', response: { ok: true } } } },
        { expect: { calls: { endpoint: 'sync', count: 1, payload: {}, response: null } } },
      ],
    })
  ).toEqual({});
  expect(
    validateJourneySteps({ steps: [{ expect: { calls: { endpoint: 'sync' } } }] }).error.replace(
      EXAMPLES,
      ''
    )
  ).toBe(
    'Step 0: Step "expect.calls" requires "count" to be a whole number of calls, 0 or more, or a "payload" or "response" to match. Received {"endpoint":"sync"}.'
  );
});

test('validateJourneySteps accepts expect.db with count or equals', () => {
  expect(
    validateJourneySteps({
      steps: [
        { expect: { db: { collection: 'orders', match: {}, count: 0 } } },
        {
          expect: {
            db: {
              collection: 'orders',
              connectionId: 'mongodb',
              match: { status: 'Open' },
              equals: [{ _id: 'ORD-1' }],
            },
          },
        },
        { expect: { db: { collection: 'orders', match: { _id: 'ORD-9' }, equals: [] } } },
      ],
    })
  ).toEqual({});
});

test('validateJourneySteps rejects malformed expect.db', () => {
  function error(db) {
    return validateJourneySteps({ steps: [{ expect: { db } }] }).error.replace(EXAMPLES, '');
  }
  expect(error({ collection: 'orders', match: {}, count: 1, equals: [] })).toBe(
    'Step 0: Step "expect.db" requires exactly one of "count" or "equals". Received {"collection":"orders","match":{},"count":1,"equals":[]}.'
  );
  expect(error({ collection: 'orders', match: {} })).toContain(
    'requires exactly one of "count" or "equals"'
  );
  expect(error({ match: {}, count: 1 })).toBe(
    'Step 0: Step "expect.db" requires "collection" to be a non-empty string. Received undefined.'
  );
  expect(error({ collection: 'orders', count: 1 })).toBe(
    'Step 0: Step "expect.db" requires "match" to be a query object, {} for every document. Received undefined.'
  );
  expect(error({ collection: 'orders', match: {}, connectionId: '', count: 1 })).toContain(
    'requires "connectionId" to be a non-empty string'
  );
  expect(error({ collection: 'orders', match: {}, count: -1 })).toBe(
    'Step 0: Step "expect.db" requires "count" to be a whole number of documents, 0 or more. Received -1.'
  );
  expect(error({ collection: 'orders', match: {}, equals: { _id: 1 } })).toBe(
    'Step 0: Step "expect.db" requires "equals" to be a list of documents. Received {"_id":1}.'
  );
  expect(error({ collection: 'orders', match: {}, count: 1, where: {} })).toBe(
    'Step 0: Step "expect.db" has unknown key "where". Keys are: collection, connectionId, match, count, equals.'
  );
  expect(error('orders')).toContain(
    'Step "expect.db" requires { collection, connectionId?, match, count }'
  );
});
