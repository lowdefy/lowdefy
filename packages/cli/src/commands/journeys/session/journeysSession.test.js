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

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

import journeysSession from './journeysSession.js';

const OLD_SESSION = '20261003T134000Z-aaaaaa';
const NEW_SESSION = '20261003T140300Z-bbbbbb';

let configDirectory;
let context;
let logs;

function at(minutes) {
  return new Date(Date.parse('2026-10-03T13:00:00.000Z') + minutes * 60000).toISOString();
}

function clock(iso) {
  const date = new Date(iso);
  const pad = (number) => String(number).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function day(iso) {
  const date = new Date(iso);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function base({ session, t, page }) {
  return {
    v: 1,
    source: 'dev',
    session,
    t,
    scope: 'page',
    page_id: page,
    roles: [],
    person: null,
    org: null,
    build: null,
  };
}

function pageview(fields) {
  return { ...base(fields), kind: 'pageview', url: `/${fields.page}`, target: null, event: null };
}

function click({ block, event, ...fields }) {
  return {
    ...base(fields),
    kind: 'click',
    target: {
      block_id: block,
      block_type: 'Button',
      row: null,
      column: null,
      text: null,
      nth: null,
      option: false,
    },
    event: event ?? null,
  };
}

function writeTrace({ id, records }) {
  const date = `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
  const directory = path.join(configDirectory, '.lowdefy', 'traces', 'dev', date);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, `${id}.jsonl`),
    records.map((record) => JSON.stringify(record)).join('\n')
  );
}

function writeFixtures() {
  writeTrace({
    id: OLD_SESSION,
    records: [
      pageview({ session: OLD_SESSION, t: at(40), page: 'settings' }),
      click({ session: OLD_SESSION, t: at(41), page: 'settings', block: 'save' }),
    ],
  });
  writeTrace({
    id: NEW_SESSION,
    records: [
      pageview({ session: NEW_SESSION, t: at(63), page: 'tickets' }),
      click({
        session: NEW_SESSION,
        t: at(64),
        page: 'tickets',
        block: 'assign',
        event: {
          name: 'onClick',
          block_id: 'assign',
          success: false,
          actions: ['Validate'],
          requests: [],
          state_writes: [],
          url_after: '/tickets',
          error: { name: 'UserError', config_key: null, action_type: 'Validate', action_id: 'v' },
          invalid_blocks: ['assignee'],
        },
      }),
      click({
        session: NEW_SESSION,
        t: at(65),
        page: 'tickets',
        block: 'assign',
        event: {
          name: 'onClick',
          block_id: 'assign',
          success: true,
          actions: ['Validate', 'Request'],
          requests: [{ id: 'assignTicket', ok: true, ms: 20 }],
          state_writes: [],
          url_after: '/tickets',
        },
      }),
    ],
  });
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-session-command-'));
  logs = [];
  context = {
    directories: {
      config: configDirectory,
      dev: path.join(configDirectory, '.lowdefy', 'dev'),
      build: path.join(configDirectory, '.lowdefy', 'server', 'build'),
    },
    options: {},
    logger: { info: (line) => logs.push(line) },
    sendTelemetry: jest.fn(),
  };
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-03T17:00:00.000Z'));
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('journeys session lists the recorded dev sessions newest first', async () => {
  writeFixtures();
  const report = await journeysSession({ context });
  expect(report.sessions.map((session) => session.id)).toEqual([NEW_SESSION, OLD_SESSION]);
  expect(logs).toEqual([
    `${NEW_SESSION}   ${day(at(63))} ${clock(at(63))}–${clock(
      at(65)
    )}   tickets   2 interactions, 1 failed (first: Validate on assign [assignee])`,
    `${OLD_SESSION}   ${day(at(40))} ${clock(at(40))}–${clock(at(41))}   settings   1 interaction`,
  ]);
  expect(context.sendTelemetry).toHaveBeenCalled();
});

test('journeys session --since leaves out sessions with no records in the window', async () => {
  writeFixtures();
  context.options = { since: '3h' };
  const report = await journeysSession({ context });
  expect(report.sessions.map((session) => session.id)).toEqual([NEW_SESSION]);
});

test('journeys session <id> prints the session as a log', async () => {
  writeFixtures();
  const report = await journeysSession({ context, params: [NEW_SESSION] });
  expect(report.log.lines).toEqual([
    'page tickets',
    'click assign → Validate failed [assignee]',
    'click assign → ran Validate, request assignTicket ok',
  ]);
  expect(logs).toEqual([
    `Session ${NEW_SESSION}, ${at(63)} to ${at(65)}:`,
    'page tickets',
    'click assign → Validate failed [assignee]',
    'click assign → ran Validate, request assignTicket ok',
  ]);
});

test('journeys session --json prints the report on stdout', async () => {
  writeFixtures();
  context.options = { json: true };
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const report = await journeysSession({ context, params: [OLD_SESSION] });
  expect(JSON.parse(write.mock.calls[0][0])).toEqual(report);
  expect(logs).toEqual([]);
});

test('journeys session with an unknown id fails naming the id and the newest sessions', async () => {
  writeFixtures();
  await expect(journeysSession({ context, params: ['20261003T000000Z-zzzzzz'] })).rejects.toThrow(
    `No session "20261003T000000Z-zzzzzz" in this window. The newest sessions are ${NEW_SESSION}, ${OLD_SESSION}.`
  );
});

test('journeys session says when nothing was recorded', async () => {
  await journeysSession({ context });
  expect(logs).toEqual(['No recorded dev sessions in this window.']);
});
