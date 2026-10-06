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

import fs from 'fs';
import os from 'os';
import path from 'path';

import L7 from './L7.js';

let buildDirectory;

function writeArtifact(artifact, content) {
  const filePath = path.join(buildDirectory, artifact);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(content));
}

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-l7-'));
  writeArtifact('pages/tickets.json', {
    id: 'tickets',
    properties: { title: 'Tickets' },
    blocks: [
      { id: 'grid', properties: { emptyText: 'No tickets found' } },
      { id: 'status', properties: { options: ['Open', 'Closed'] } },
    ],
  });
  writeArtifact('pages/ticket.json', { id: 'ticket', properties: { title: 'Ticket detail' } });
  writeArtifact('menus.json', [{ id: 'default', links: [{ properties: { title: 'Home' } }] }]);
  writeArtifact('i18n.json', {
    defaultLocale: 'en',
    messages: { en: { 'engine.validation.fieldRequired': 'This field is required' } },
  });
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

const snapshotStrings = new Set(['Staging customer', 'Fixture printer', 'Open']);

function dataSet(extra = {}) {
  return {
    name: 'staging',
    snapshotSpec: { from: 'staging', connections: ['tickets'] },
    snapshot: { pulledAt: '2026-10-01T00:00:00.000Z', collections: {} },
    fixtures: {
      tickets: [
        {
          _id: 'fixture-ticket-1',
          title: 'Fixture printer',
          org: 'acme',
          locations: [{ path: '/KLT' }],
        },
      ],
    },
    users: { member: { roles: ['member'], name: 'Mia Member', email: 'mia@example.com' } },
    ...extra,
  };
}

function lint(steps, { lint: inputs = {}, ...journeyKeys } = {}) {
  return L7({
    journey: { name: 'finds a ticket', pageId: 'tickets', data: 'staging', steps, ...journeyKeys },
    exercisedEntry: null,
    dataSet: dataSet(),
    buildDirectory,
    snapshotStrings,
    pageErrors: {},
    ...inputs,
  });
}

test('L7 skips a fixtures-only data set and a journey with no data set', () => {
  const steps = [{ expect: { text: { blockId: 'grid', contains: 'Staging customer' } } }];
  expect(
    L7({
      journey: { name: 'j', pageId: 'tickets', steps },
      exercisedEntry: null,
      dataSet: dataSet({ snapshotSpec: null, snapshot: null }),
      buildDirectory,
      snapshotStrings: null,
      pageErrors: {},
    })
  ).toEqual([]);
  expect(
    L7({
      journey: { name: 'j', pageId: 'tickets', steps },
      exercisedEntry: null,
      dataSet: null,
      buildDirectory,
      snapshotStrings: null,
      pageErrors: {},
    })
  ).toEqual([]);
});

test('L7 passes values from fixtures, users, page config, menus and i18n', () => {
  expect(
    lint([
      { select: { blockId: 'status', value: 'Open' } },
      { click: { blockId: 'grid', containing: 'printer' } },
      { click: { text: 'Home' } },
      { expect: { text: { blockId: 'grid', contains: 'No tickets' } } },
      { expect: { text: { blockId: 'owner', contains: 'Mia Member' } } },
      { expect: { title: { equals: 'Tickets' } } },
      { expect: { text: { blockId: 'title', contains: 'This field is required' } } },
      { expect: { visible: { blockId: 'grid', containing: 'Fixture printer' } } },
    ])
  ).toEqual([]);
});

test('L7 refuses a snapshot value in a target, an expect.text and a select', () => {
  const problems = lint([
    { click: { blockId: 'grid', containing: 'Staging customer' } },
    { expect: { text: { blockId: 'grid', contains: 'Staging' } } },
    { select: { blockId: 'customer', value: 'Staging customer' } },
    { expect: { hidden: { text: 'Staging customer' } } },
  ]);
  expect(problems.map(({ stepIndex }) => stepIndex)).toEqual([0, 1, 2, 3]);
  expect(problems[0]).toEqual({
    severity: 'error',
    stepIndex: 0,
    message:
      'step 0 (click "grid") containing "Staging customer" is not part of the app\'s text, a fixture or user of data set "staging", or an earlier fill: on a snapshot data set it may exist in only one pull. Use a fixture value.',
  });
  expect(problems[2].message).toMatch(
    /^step 2 \(select "customer"\) value "Staging customer" is not the app's text/
  );
});

test('L7 allows a value an earlier fill typed, but not one typed only after the step', () => {
  expect(
    lint([
      { fill: { blockId: 'title', value: 'Brand new ticket' } },
      { click: 'save' },
      { expect: { text: { blockId: 'grid', contains: 'Brand new' } } },
      { click: { blockId: 'grid', containing: 'Brand new ticket' } },
    ])
  ).toEqual([]);
  const problems = lint([
    { expect: { text: { blockId: 'grid', contains: 'Later ticket' } } },
    { fill: { blockId: 'title', value: 'Later ticket' } },
  ]);
  expect(problems.map(({ stepIndex }) => stepIndex)).toEqual([0]);
});

test('L7 passes an explorer synthetic typed value and its later assertion', () => {
  expect(
    lint([
      { fill: { blockId: 'title', value: 'Explorer title 3' } },
      { expect: { state: { path: 'title', equals: 'Explorer title 3' } } },
      { expect: { visible: { blockId: 'grid', containing: 'Explorer title 3' } } },
    ])
  ).toEqual([]);
});

test('L7 refuses a snapshot string in expect.state.equals and passes booleans, numbers and null', () => {
  const problems = lint([
    {
      expect: {
        state: {
          path: 'ticket',
          equals: { title: 'Staging customer', count: 3, done: false, note: null, tags: ['Open'] },
        },
      },
    },
  ]);
  expect(problems).toEqual([
    {
      severity: 'error',
      stepIndex: 0,
      message:
        'step 0 (expect: { state }) state ticket equals.title "Staging customer" is not the app\'s text, a fixture or user of data set "staging", or an earlier fill: on a snapshot data set it may exist in only one pull. Use a fixture value.',
    },
  ]);
});

test('L7 passes an indexed state path whose value is a fixture value', () => {
  expect(lint([{ expect: { state: { path: 'locations.0.path', equals: '/KLT' } } }])).toEqual([]);
});

test('L7 refuses a snapshot id in the journey urlQuery and a goto urlQuery, and reads the goto page', () => {
  const problems = lint(
    [
      { goto: { pageId: 'ticket', urlQuery: { id: '65f0c0ffee0000000000abcd' } } },
      { expect: { title: { equals: 'Ticket detail' } } },
    ],
    { urlQuery: { id: '65f0c0ffee0000000000beef', tab: 'Open' } }
  );
  expect(problems.map(({ message }) => message.split(' is ')[0])).toEqual([
    'the journey urlQuery.id "65f0c0ffee0000000000beef"',
    'step 0 (goto "ticket") urlQuery.id "65f0c0ffee0000000000abcd"',
  ]);
});

test('L7 refuses a snapshot id in the journey pathParams and a goto pathParams', () => {
  const problems = lint(
    [
      { goto: { pageId: 'ticket', pathParams: { ticket_id: '65f0c0ffee0000000000abcd' } } },
      { expect: { title: { equals: 'Ticket detail' } } },
    ],
    { pathParams: { ticket_id: '65f0c0ffee0000000000beef' } }
  );
  expect(problems.map(({ message }) => message.split(' is ')[0])).toEqual([
    'the journey pathParams.ticket_id "65f0c0ffee0000000000beef"',
    'step 0 (goto "ticket") pathParams.ticket_id "65f0c0ffee0000000000abcd"',
  ]);
});

test('L7 refuses a snapshot id in a recorded expect.url query and passes a path or fixture value', () => {
  const problems = lint([
    { expect: { url: { contains: '/ticket?id=65f0c0ffee0000000000abcd&tab=Open' } } },
    { expect: { url: { contains: '/404' } } },
    { expect: { url: { contains: '/tickets?title=Fixture%20printer' } } },
  ]);
  expect(problems.map(({ stepIndex, message }) => [stepIndex, message.split(' is ')[0]])).toEqual([
    [0, 'step 0 (expect: { url }) url contains query id "65f0c0ffee0000000000abcd"'],
  ]);
});

test('L7 checks expect.url.contains: a bare snapshot id and a query id fail, page paths and a fixture id pass', () => {
  const problems = lint([
    { expect: { url: { contains: '65f0c0ffee0000000000abcd' } } },
    { expect: { url: { contains: '?id=65f0c0ffee0000000000abcd' } } },
    { expect: { url: { contains: '/404' } } },
    { expect: { url: { contains: '/tickets' } } },
    { expect: { url: { contains: '/ticket?id=fixture-ticket-1' } } },
    { expect: { url: { contains: 'fixture-ticket' } } },
    { expect: { url: { contains: '/ticket?65f0c0ffee0000000000beef' } } },
  ]);
  expect(problems.map(({ stepIndex, message }) => [stepIndex, message.split(' is ')[0]])).toEqual([
    [0, 'step 0 (expect: { url }) url contains "65f0c0ffee0000000000abcd"'],
    [1, 'step 1 (expect: { url }) url contains query id "65f0c0ffee0000000000abcd"'],
    [6, 'step 6 (expect: { url }) url contains "65f0c0ffee0000000000beef"'],
  ]);
  expect(problems[0].message).toMatch(/ is not part of the app's text/);
  expect(problems[1].message).toMatch(/ is not the app's text/);
});

test('L7 refuses a snapshot-only address in an email step and a fill.fromEmail', () => {
  const problems = lint([
    { email: { to: 'staging.user@example.com' } },
    {
      fill: {
        blockId: 'code',
        fromEmail: { to: 'staging.user@example.com', match: '\\b\\d{6}\\b' },
      },
    },
  ]);
  expect(problems.map(({ stepIndex, message }) => [stepIndex, message.split(' is ')[0]])).toEqual([
    [0, 'step 0 (email) to "staging.user@example.com"'],
    [1, 'step 1 (fill "code") fromEmail to "staging.user@example.com"'],
  ]);
});

test('L7 passes an email address of a fixture user or one an earlier fill typed', () => {
  expect(
    lint([
      { email: { to: 'mia@example.com' } },
      { fill: { blockId: 'code', fromEmail: { to: 'mia@example.com', match: '\\d+' } } },
      { fill: { blockId: 'email', value: 'new.user@example.com' } },
      { click: 'invite' },
      { email: { to: 'new.user@example.com' } },
      { fill: { blockId: 'code', fromEmail: { to: 'new.user@example.com', match: '\\d+' } } },
    ])
  ).toEqual([]);
});

test('L7 checks an email subject as a substring: snapshot-only fails, built config text passes', () => {
  const problems = lint([
    { email: { to: 'mia@example.com', subject: 'Staging customer' } },
    { email: { to: 'mia@example.com', subject: 'No tickets' } },
    {
      fill: {
        blockId: 'code',
        fromEmail: { to: 'mia@example.com', subject: 'Staging customer', match: '\\d+' },
      },
    },
    {
      fill: {
        blockId: 'code',
        fromEmail: { to: 'mia@example.com', subject: 'Tickets', match: '\\d+' },
      },
    },
  ]);
  expect(problems.map(({ stepIndex, message }) => [stepIndex, message.split(' is ')[0]])).toEqual([
    [0, 'step 0 (email) subject "Staging customer"'],
    [2, 'step 2 (fill "code") fromEmail subject "Staging customer"'],
  ]);
  expect(problems[0].message).toMatch(/ is not part of the app's text/);
});

test('L7 refuses a typed value only the pulled snapshot holds', () => {
  const problems = lint([
    { fill: { blockId: 'search', value: 'Staging customer' } },
    { fill: { blockId: 'title', value: 'Fixture printer' } },
    { fill: { blockId: 'note', value: 'Something new' } },
    { expect: { visible: 'grid' } },
  ]);
  expect(problems).toEqual([
    {
      severity: 'error',
      stepIndex: 0,
      message:
        'step 0 (fill "search") types "Staging customer", which only the pulled snapshot of data set "staging" holds: type a fixture value or new text.',
    },
  ]);
});

test('L7 skips the typing check with one note when the snapshot is not pulled here', () => {
  const problems = L7({
    journey: {
      name: 'j',
      pageId: 'tickets',
      steps: [
        { fill: { blockId: 'search', value: 'Staging customer' } },
        { fill: { blockId: 'note', value: 'Other' } },
      ],
    },
    exercisedEntry: null,
    dataSet: dataSet({ snapshot: null }),
    buildDirectory,
    snapshotStrings: null,
    pageErrors: {},
  });
  expect(problems).toEqual([
    {
      severity: 'info',
      message:
        'typed values not checked: data set "staging" has no snapshot pulled on this machine (lowdefy data pull staging).',
    },
  ]);
});

test('L7 refuses a bare row on a snapshot set and passes a row with containing', () => {
  const problems = lint([
    { click: { blockId: 'grid', row: 2 } },
    { click: { blockId: 'grid', row: 0, containing: 'Fixture printer' } },
    { expect: { visible: { blockId: 'grid', row: 1, column: 'title' } } },
  ]);
  expect(problems.map(({ stepIndex, message }) => [stepIndex, message])).toEqual([
    [0, 'step 0 (click "grid") picks row 2 on snapshot data: use containing: <fixture value>.'],
    [
      2,
      'step 2 (expect: { visible }) picks row 1 on snapshot data: use containing: <fixture value>.',
    ],
  ]);
});

test('L7 reads the exercised pages when the journey has a measured run', () => {
  const steps = [{ expect: { title: { equals: 'Ticket detail' } } }];
  expect(lint(steps)).toHaveLength(1);
  expect(
    lint(steps, {
      lint: {
        exercisedEntry: { exercised: { pages: ['tickets', 'ticket'], events: [] } },
      },
    })
  ).toEqual([]);
});

test('L7 reports a page that could not be built instead of checking', () => {
  expect(
    lint([{ expect: { visible: 'grid' } }], {
      lint: { pageErrors: { tickets: 'Its build failed: Block type "Buton" not found.' } },
    })
  ).toEqual([
    {
      severity: 'error',
      message:
        'not checked for snapshot values: page "tickets" could not be built. Its build failed: Block type "Buton" not found.',
    },
  ]);
});
