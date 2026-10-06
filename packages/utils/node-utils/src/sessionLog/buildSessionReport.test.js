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

import buildSessionReport from './buildSessionReport.js';
import formatSessionReport from './formatSessionReport.js';
import traceRecord from '../journeyCompiler/traceRecord.js';

// The list shows local time, so the expected clock is read the same way.
function clock(iso) {
  const date = new Date(iso);
  const pad = (number) => String(number).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function failedSave({ at, session }) {
  return traceRecord({
    at,
    session,
    page: 'ticket-new',
    block: 'save',
    event: {
      name: 'onClick',
      block_id: 'save',
      success: false,
      error: { name: 'UserError', action_type: 'Validate', config_key: null, action_id: 'v' },
      invalid_blocks: ['priority'],
    },
  });
}

const records = [
  traceRecord({ at: 0, session: 's-old', kind: 'pageview', page: 'tickets', url: '/tickets' }),
  traceRecord({ at: 1, session: 's-old', page: 'tickets', block: 'new' }),
  traceRecord({ at: 600, session: 's-new', kind: 'pageview', page: 'ticket-new', url: '/x' }),
  traceRecord({ at: 601, session: 's-new', page: 'ticket-new', kind: 'key', key: 'a' }),
  failedSave({ at: 602, session: 's-new' }),
  traceRecord({ at: 603, session: 's-new', page: 'ticket-new', kind: 'back' }),
  traceRecord({ at: 604, session: 's-new', kind: 'pageview', page: 'tickets', url: '/tickets' }),
];

test('buildSessionReport lists the sessions newest first with their counts', () => {
  const report = buildSessionReport({ records });
  expect(report.sessions.map((session) => session.id)).toEqual(['s-new', 's-old']);
  expect(report.sessions[0]).toEqual({
    id: 's-new',
    start: '2026-09-28T14:10:00.000Z',
    end: '2026-09-28T14:10:04.000Z',
    builds: [],
    pages: ['ticket-new', 'tickets'],
    interactions: 2,
    failures: 1,
    firstFailure: { block_id: 'save', action_type: 'Validate', invalid_blocks: ['priority'] },
  });
  expect(formatSessionReport({ report, empty: 'none' })).toEqual([
    `s-new   2026-09-28 ${clock('2026-09-28T14:10:00.000Z')}–${clock(
      '2026-09-28T14:10:04.000Z'
    )}   ticket-new → tickets   2 interactions, 1 failed (first: Validate on save [priority])`,
    `s-old   2026-09-28 ${clock('2026-09-28T14:00:00.000Z')}–${clock(
      '2026-09-28T14:00:01.000Z'
    )}   tickets   1 interaction`,
  ]);
});

test('buildSessionReport gives the log of the session the id names', () => {
  const report = buildSessionReport({ records, id: 's-old' });
  expect(report.log.lines).toEqual(['page tickets', 'click new']);
  expect(formatSessionReport({ report, empty: 'none' })).toEqual([
    'Session s-old, 2026-09-28T14:00:00.000Z to 2026-09-28T14:00:01.000Z:',
    'page tickets',
    'click new',
  ]);
});

test('buildSessionReport names the id and the newest sessions when the id is unknown', () => {
  expect(buildSessionReport({ records, id: 's-missing' })).toEqual({
    error: 'No session "s-missing" in this window. The newest sessions are s-new, s-old.',
  });
  expect(buildSessionReport({ records: [], id: 's-missing' })).toEqual({
    error: 'No session "s-missing" in this window: there are no sessions in it.',
  });
});

test('formatSessionReport prints the empty line when the window holds no sessions', () => {
  const report = buildSessionReport({ records: [] });
  expect(formatSessionReport({ report, empty: 'No recorded dev sessions.' })).toEqual([
    'No recorded dev sessions.',
  ]);
});

test('formatSessionReport gives the day of the end when a session runs past midnight', () => {
  const report = {
    sessions: [
      {
        id: 's-late',
        start: new Date(2026, 8, 28, 23, 50).toISOString(),
        end: new Date(2026, 8, 29, 0, 10).toISOString(),
        pages: [],
        interactions: 0,
        failures: 0,
        firstFailure: null,
      },
    ],
  };
  expect(formatSessionReport({ report, empty: 'none' })).toEqual([
    's-late   2026-09-28 23:50–2026-09-29 00:10   0 interactions',
  ]);
});
