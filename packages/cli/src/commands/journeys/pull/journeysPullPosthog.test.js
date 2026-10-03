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

import { row } from './tests/postHogRows.js';

const KEY = 'phx_pull_key_never_written_42';
const mockQuery = jest.fn();
jest.unstable_mockModule('./createPostHogQueryClient.js', () => ({
  default: jest.fn(() => ({ query: mockQuery })),
}));

const { default: journeysPullPosthog } = await import('./journeysPullPosthog.js');
const { default: PullStoppedError } = await import('./PullStoppedError.js');

const DAY = 24 * 60 * 60 * 1000;
const COLUMNS = Object.keys(row({ uuid: 'x', timestamp: 'x' }));

let configDirectory;
let context;
let logged;
let queriedDays;
let dayRows;

function utcDay(time) {
  return new Date(time).toISOString().slice(0, 10);
}

function production() {
  return path.join(configDirectory, '.lowdefy', 'traces', 'production');
}

// A fake PostHog: each day has a pageview and a click; the count query
// answers the day's row count.
function answer({ query, values }) {
  const day = values.day_start.slice(0, 10);
  const rows = dayRows(day);
  if (query.includes('count()')) {
    return { results: [[rows.length, 0]], columns: ['total', 'unenriched'], bytesRead: 5 };
  }
  queriedDays.push(day);
  const page = rows.filter(
    (entry) =>
      entry.timestamp > values.after_ts ||
      (entry.timestamp === values.after_ts && entry.uuid > values.after_uuid)
  );
  return {
    results: page.slice(0, values.page_size).map((entry) => COLUMNS.map((column) => entry[column])),
    columns: COLUMNS,
    bytesRead: 100,
  };
}

function defaultDayRows(day) {
  return [
    row({
      uuid: `${day}-1`,
      timestamp: `${day}T10:00:00.000000Z`,
      event: '$pageview',
      person_id: 'raw-person',
    }),
    row({
      uuid: `${day}-2`,
      timestamp: `${day}T10:00:01.000000Z`,
      eventType: 'click',
      elText: 'Save',
      lowdefy_block_id: 'save',
      lowdefy_block_type: 'Button',
    }),
  ];
}

async function pull(options = {}) {
  context.options = { since: '3d', ...options };
  return journeysPullPosthog({ context, params: ['posthog'] });
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-pull-'));
  logged = [];
  queriedDays = [];
  dayRows = defaultDayRows;
  const log = (message) => logged.push(String(message));
  context = {
    directories: {
      config: configDirectory,
      traces: path.join(configDirectory, '.lowdefy', 'traces'),
    },
    logger: { info: log, warn: log, error: log, debug: log },
    sendTelemetry: async () => {},
  };
  process.env.POSTHOG_PROJECT_ID = '300001';
  process.env.POSTHOG_API_HOST = 'https://eu.posthog.com';
  process.env.POSTHOG_PERSONAL_API_KEY = KEY;
  mockQuery.mockReset();
  mockQuery.mockImplementation(async (request) => answer(request));
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-03T12:00:00.000Z'));
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(configDirectory, { recursive: true, force: true });
  delete process.env.POSTHOG_PROJECT_ID;
  delete process.env.POSTHOG_API_HOST;
  delete process.env.POSTHOG_PERSONAL_API_KEY;
});

test('journeys pull posthog writes a day file and manifest per day under traces/production', async () => {
  const result = await pull();
  expect(result).toMatchObject({
    days: 3,
    rows: 6,
    records: 6,
    window: { from: '2026-10-01', to: '2026-10-03' },
  });
  expect(fs.readdirSync(production()).sort()).toEqual([
    '2026-10-01.jsonl',
    '2026-10-01.manifest.json',
    '2026-10-02.jsonl',
    '2026-10-02.manifest.json',
    '2026-10-03.jsonl',
    '2026-10-03.manifest.json',
    'salt',
  ]);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(production(), '2026-10-01.manifest.json'), 'utf8')
  );
  expect(manifest).toMatchObject({
    day: '2026-10-01',
    final: true,
    project_id: '300001',
    api_host: 'https://eu.posthog.com',
    environment: null,
    environments_seen: [],
    filter_test_accounts: true,
    rows_by_event: { $pageview: 1, $autocapture: 1 },
    records_written: 2,
    dropped: {},
    enriched_share: 1,
    chain_fallbacks: 0,
    queries: 2,
    bytes_read: 105,
  });
  expect(manifest.salt_id).toMatch(/^[0-9a-f]{8}$/);
  const today = JSON.parse(
    fs.readFileSync(path.join(production(), '2026-10-03.manifest.json'), 'utf8')
  );
  expect(today.final).toBe(false);
});

test('journeys pull posthog the next day queries only today and yesterday', async () => {
  await pull();
  queriedDays = [];
  Date.now.mockReturnValue(Date.parse('2026-10-04T08:00:00.000Z'));
  await pull({ since: '4d' });
  expect(queriedDays).toEqual(['2026-10-02', '2026-10-03', '2026-10-04']);
  expect(logged).toContain('2026-10-01  skipped (final)');
});

test('journeys pull posthog --refetch queries final days again', async () => {
  await pull();
  queriedDays = [];
  await pull({ refetch: true });
  expect(queriedDays).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
});

test('journeys pull posthog re-pulls a day hashed under another salt', async () => {
  await pull();
  const manifestPath = path.join(production(), '2026-10-01.manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  fs.writeFileSync(manifestPath, JSON.stringify({ ...manifest, salt_id: '00000000' }));
  queriedDays = [];
  await pull();
  expect(queriedDays).toContain('2026-10-01');
  expect(logged.some((line) => line.startsWith('2026-10-01  re-pulled (salt changed)'))).toBe(true);
});

test('journeys pull posthog re-pulls a day byte for byte with the same salt', async () => {
  await pull();
  const dayPath = path.join(production(), '2026-10-02.jsonl');
  const before = fs.readFileSync(dayPath, 'utf8');
  await pull({ refetch: true });
  expect(fs.readFileSync(dayPath, 'utf8')).toBe(before);
});

test('journeys pull posthog creates the salt once and reuses it', async () => {
  await pull();
  const salt = fs.readFileSync(path.join(production(), 'salt'));
  expect(salt).toHaveLength(32);
  await pull({ refetch: true });
  expect(fs.readFileSync(path.join(production(), 'salt')).equals(salt)).toBe(true);
});

test('journeys pull posthog prunes day files older than 400 days', async () => {
  fs.mkdirSync(production(), { recursive: true });
  const old = utcDay(Date.parse('2026-10-03T00:00:00Z') - 401 * DAY);
  const young = utcDay(Date.parse('2026-10-03T00:00:00Z') - 399 * DAY);
  [old, young].forEach((day) => {
    fs.writeFileSync(path.join(production(), `${day}.jsonl`), '');
    fs.writeFileSync(path.join(production(), `${day}.manifest.json`), '{}');
  });
  await pull();
  expect(fs.existsSync(path.join(production(), `${old}.jsonl`))).toBe(false);
  expect(fs.existsSync(path.join(production(), `${old}.manifest.json`))).toBe(false);
  expect(fs.existsSync(path.join(production(), `${young}.jsonl`))).toBe(true);
});

test('journeys pull posthog stops on a long Retry-After leaving the days already written', async () => {
  mockQuery.mockImplementation(async (request) => {
    if (request.values.day_start.startsWith('2026-10-01')) {
      throw new PullStoppedError(
        'PostHog is rate limiting queries. Run the pull again after 2026-10-03T13:00:00.000Z to resume.',
        {
          reason: 'rate_limit',
        }
      );
    }
    return answer(request);
  });
  const result = await pull({ since: '5d' });
  expect(result).toMatchObject({ stopped: 'rate_limit', days: 2 });
  expect(fs.existsSync(path.join(production(), '2026-09-29.manifest.json'))).toBe(true);
  expect(fs.existsSync(path.join(production(), '2026-09-30.manifest.json'))).toBe(true);
  expect(fs.existsSync(path.join(production(), '2026-10-01.manifest.json'))).toBe(false);
  expect(logged.join('\n')).toContain('Run the pull again after');
});

test('journeys pull posthog stops before a day that would pass --max-rows', async () => {
  const result = await pull({ maxRows: '3' });
  expect(result).toMatchObject({ stopped: 'max_rows', days: 1 });
  expect(logged.join('\n')).toContain('shorten --since');
});

test('journeys pull refuses an adapter other than posthog', async () => {
  context.options = {};
  await expect(journeysPullPosthog({ context, params: ['mixpanel'] })).rejects.toThrow(
    'lowdefy journeys pull reads from posthog. Received "mixpanel".'
  );
});

test('journeys pull posthog refuses --from without --to', async () => {
  await expect(pull({ since: undefined, from: '2026-10-01' })).rejects.toThrow(
    '--from and --to go together'
  );
});

test('journeys pull posthog refuses a property name before any request', async () => {
  await expect(pull({ orgProperty: 'org_id; DROP' })).rejects.toThrow('--org-property');
  expect(mockQuery).not.toHaveBeenCalled();
});

test('journeys pull posthog fails naming a missing credential before any request', async () => {
  delete process.env.POSTHOG_PERSONAL_API_KEY;
  await expect(pull()).rejects.toThrow('POSTHOG_PERSONAL_API_KEY');
  expect(mockQuery).not.toHaveBeenCalled();
});

test('journeys pull posthog writes the key and raw ids to no manifest, day file or log line', async () => {
  await pull();
  const written = fs
    .readdirSync(production())
    .filter((name) => name !== 'salt')
    .map((name) => fs.readFileSync(path.join(production(), name), 'utf8'))
    .join('\n');
  expect(written).not.toContain(KEY);
  expect(written).not.toContain('raw-person');
  expect(logged.join('\n')).not.toContain(KEY);
});
