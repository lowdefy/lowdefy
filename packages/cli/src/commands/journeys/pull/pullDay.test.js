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

import PullStoppedError from './PullStoppedError.js';
import pullDay from './pullDay.js';

describe('pullDay', () => {
  const COLUMNS = ['uuid', 'timestamp', 'event'];

  // A fake PostHog that answers the count query and applies the keyset rule
  // the real query states, so paging is tested against the same contract.
  function createFakeClient({ events, unenriched = 0 }) {
    const calls = [];
    const client = {
      query: jest.fn(async ({ query, values, filterTestAccounts }) => {
        calls.push({ query, values, filterTestAccounts });
        if (query.includes('count()')) {
          return {
            results: [[events.length, unenriched]],
            columns: ['total', 'unenriched'],
            bytesRead: 10,
          };
        }
        const page = events
          .filter(
            (event) =>
              event.timestamp > values.after_ts ||
              (event.timestamp === values.after_ts && event.uuid > values.after_uuid)
          )
          .slice(0, values.page_size);
        return {
          results: page.map((event) => COLUMNS.map((column) => event[column])),
          columns: COLUMNS,
          bytesRead: 100,
        };
      }),
    };
    return { client, calls };
  }

  const EVENTS = [
    { uuid: 'a', timestamp: '2026-10-01T10:00:00.001000Z', event: '$pageview' },
    { uuid: 'b', timestamp: '2026-10-01T10:00:00.002000Z', event: '$autocapture' },
    { uuid: 'c', timestamp: '2026-10-01T10:00:00.002000Z', event: '$autocapture' },
    { uuid: 'd', timestamp: '2026-10-01T10:00:00.003000Z', event: '$pageleave' },
  ];

  test('pullDay keeps two events of the same millisecond across a page boundary', async () => {
    const { client } = createFakeClient({ events: EVENTS });
    const result = await pullDay({ client, day: '2026-10-01', pageSize: 2 });
    expect(result.rows.map((row) => row.uuid)).toEqual(['a', 'b', 'c', 'd']);
    expect(result.rows[0]).toEqual(EVENTS[0]);
    // count, page 1 (a b), page 2 (c d), page 3 (empty) ends the day.
    expect(result.queries).toBe(4);
    expect(result.bytesRead).toBe(310);
  });

  test('pullDay ends the day on a page shorter than the page size', async () => {
    const { client } = createFakeClient({ events: EVENTS });
    const result = await pullDay({ client, day: '2026-10-01', pageSize: 3 });
    expect(result.rows).toHaveLength(4);
    expect(result.queries).toBe(3);
  });

  test('pullDay refuses a page size above 50,000', async () => {
    const { client } = createFakeClient({ events: EVENTS });
    await expect(pullDay({ client, day: '2026-10-01', pageSize: 50001 })).rejects.toThrow('50000');
    expect(client.query).not.toHaveBeenCalled();
  });

  test('pullDay selects elements_chain only when some interaction is unenriched', async () => {
    const enriched = createFakeClient({ events: EVENTS, unenriched: 0 });
    const enrichedResult = await pullDay({
      client: enriched.client,
      day: '2026-10-01',
      pageSize: 10,
    });
    expect(enrichedResult.includeChain).toBe(false);
    expect(enriched.calls[1].query).not.toContain('elements_chain');

    const chainOnly = createFakeClient({ events: EVENTS, unenriched: 2 });
    const chainResult = await pullDay({
      client: chainOnly.client,
      day: '2026-10-01',
      pageSize: 10,
    });
    expect(chainResult.includeChain).toBe(true);
    expect(chainOnly.calls[1].query).toContain('elements_chain');
  });

  test('pullDay passes the test-account filter on every query', async () => {
    const { client, calls } = createFakeClient({ events: EVENTS });
    await pullDay({ client, day: '2026-10-01', pageSize: 10, filterTestAccounts: false });
    expect(calls.every((call) => call.filterTestAccounts === false)).toBe(true);
  });

  test('pullDay stops before paging a day that would pass the rows left under --max-rows', async () => {
    const { client } = createFakeClient({ events: EVENTS });
    const error = await pullDay({ client, day: '2026-10-01', pageSize: 10, maxRows: 3 }).catch(
      (caught) => caught
    );
    expect(error).toBeInstanceOf(PullStoppedError);
    expect(error.reason).toBe('max_rows');
    expect(error.message).toContain('shorten --since');
    expect(client.query).toHaveBeenCalledTimes(1);
  });
});
