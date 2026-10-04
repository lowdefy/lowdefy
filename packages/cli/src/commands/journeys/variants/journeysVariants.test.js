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

const mockPost = jest.fn();
const mockGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { post: mockPost, get: mockGet },
}));

const mockStartDevServer = jest.fn();
jest.unstable_mockModule('../../test/startDevServer.js', () => ({
  default: mockStartDevServer,
}));

const url = 'http://localhost:3230';
let configDirectory;
let context;
let logs;
const originalExitCode = process.exitCode;

const journey = {
  name: 'saves a ticket',
  pageId: 'tickets',
  user: 'none',
  steps: [
    { fill: { blockId: 'title', value: 'Printer jam' } },
    { click: 'save' },
    { wait: { request: 'save' } },
    { expect: { visible: 'saved' } },
  ],
};

const exercised = {
  pages: ['tickets'],
  appEvents: true,
  requests: [{ pageId: 'tickets', requestId: 'save', calls: 1, write: true }],
  endpoints: [],
  events: [],
  rendered: {},
};

const pageConfig = {
  blockId: 'tickets',
  type: 'Box',
  slots: { content: { blocks: [{ blockId: 'title', type: 'TextInput', required: true }] } },
};

function journeysPath(...parts) {
  return path.join(configDirectory, 'tests', 'journeys', ...parts);
}

function variantsPath(...parts) {
  return journeysPath('_candidates', 'variants', 'tickets', ...parts);
}

function listVariants() {
  const directory = variantsPath();
  return fs.existsSync(directory) ? fs.readdirSync(directory).sort() : [];
}

beforeEach(() => {
  process.exitCode = undefined;
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-variants-command-'));
  fs.mkdirSync(journeysPath(), { recursive: true });
  fs.writeFileSync(journeysPath('tickets.yaml'), JSON.stringify(journey));
  logs = { info: [], warn: [], error: [] };
  context = {
    directories: {
      config: configDirectory,
      journeys: journeysPath(),
      test: path.join(configDirectory, '.lowdefy', 'test'),
    },
    options: {},
    logger: {
      info: (line) => logs.info.push(line),
      warn: (line) => logs.warn.push(line),
      error: (line) => logs.error.push(line),
      debug: jest.fn(),
    },
    sendTelemetry: jest.fn(),
  };
  mockGet.mockImplementation(async (target) => {
    if (target === `${url}/lowdefy-docs/page-config/tickets`) return { data: pageConfig };
    if (target === `${url}/api/root`) return { data: { i18n: {} } };
    return { data: { buildId: 'build-1' } };
  });
  mockPost.mockResolvedValue({ data: { passed: true, steps: [], exercised } });
});

afterEach(() => {
  process.exitCode = originalExitCode;
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

async function variants(options) {
  const { default: journeysVariants } = await import('./journeysVariants.js');
  context.options = { url, file: journeysPath('tickets.yaml'), ...options };
  await journeysVariants({ context });
}

test('journeysVariants --no-run measures the journey once, writes the variants and replays none', async () => {
  await variants({ run: false });
  expect(process.exitCode).toBeUndefined();
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(listVariants()).toEqual([
    'saves-a-ticket-double-submit.yaml',
    'saves-a-ticket-interrupt.yaml',
    'saves-a-ticket-negative.yaml',
  ]);
  expect(logs.info.filter((line) => line.startsWith('SKIPPED'))).toEqual([
    'SKIPPED  role: the journey declares no data: set',
    'SKIPPED  role: the journey declares no data: set',
    'SKIPPED  tenant: the journey declares no data: set',
    'SKIPPED  empty: pass --empty-data <data set> to write it',
    'SKIPPED  volume: pass --volume-data <data set> to write it',
  ]);
  // The baseline is recorded, so the next run reads it instead of measuring.
  expect(fs.existsSync(path.join(configDirectory, '.lowdefy', 'test', 'exercised.json'))).toBe(
    true
  );
});

test('journeysVariants writes byte-identical files on a second run, from the recorded path', async () => {
  await variants({ run: false });
  const first = listVariants().map((name) => fs.readFileSync(variantsPath(name), 'utf8'));
  mockPost.mockClear();
  await variants({ run: false });
  expect(mockPost).not.toHaveBeenCalled();
  expect(listVariants().map((name) => fs.readFileSync(variantsPath(name), 'utf8'))).toEqual(first);
});

test('journeysVariants replays each variant three times and classifies it', async () => {
  await variants({ kinds: 'double-submit' });
  // One baseline, then three replays of the one variant.
  expect(mockPost).toHaveBeenCalledTimes(4);
  expect(mockPost.mock.calls[1][1].steps[1]).toEqual({ click: { blockId: 'save', count: 2 } });
  expect(logs.info.some((line) => line.startsWith('PASS'))).toBe(true);
});

test('journeysVariants does not replay a variant with a placeholder to fill', async () => {
  const withRule = {
    ...pageConfig,
    slots: {
      content: {
        blocks: [
          { blockId: 'title', type: 'TextInput', validate: [{ pass: true, message: 'Too short' }] },
        ],
      },
    },
  };
  mockGet.mockImplementation(async (target) => {
    if (target.endsWith('/page-config/tickets')) return { data: withRule };
    if (target.endsWith('/api/root')) return { data: { i18n: {} } };
    return { data: { buildId: 'build-1' } };
  });
  await variants({ kinds: 'negative' });
  expect(mockPost).toHaveBeenCalledTimes(1);
  const relative = path.join(
    'tests',
    'journeys',
    '_candidates',
    'variants',
    'tickets',
    'saves-a-ticket-negative.yaml'
  );
  const prefix = `NOT RUN  ${relative}: `;
  expect(logs.warn[0].slice(0, prefix.length)).toEqual(prefix);
});

test('journeysVariants refuses unknown kinds and a file of several journeys without --name', async () => {
  await variants({ kinds: 'negative,typo' });
  expect(process.exitCode).toBe(1);
  expect(logs.error).toContain(
    '--kinds takes role, tenant, empty, volume, negative, interrupt, double-submit. Received "typo".'
  );
  process.exitCode = undefined;
  fs.writeFileSync(
    journeysPath('tickets.yaml'),
    JSON.stringify([journey, { ...journey, name: 'saves another ticket' }])
  );
  await variants({});
  expect(process.exitCode).toBe(1);
  expect(logs.error.at(-1)).toContain('pick one with --name');
  expect(mockStartDevServer).not.toHaveBeenCalled();
});

function writeDataSet(name, content) {
  const filePath = path.join(configDirectory, 'tests', 'data', `${name}.yaml`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

const dataSetJourney = {
  name: 'member opens a ticket',
  pageId: 'tickets',
  data: 'tickets',
  user: 'member',
  steps: [
    { click: { blockId: 'tickets_grid', containing: 'Printer jam' } },
    { expect: { text: { blockId: 'title', contains: 'Printer jam' } } },
  ],
};

test('journeysVariants writes the data-set kinds from data set files, byte for byte', async () => {
  writeDataSet(
    'tickets',
    [
      'fixtures:',
      '  tickets:',
      '    - { _id: t1, organizationId: org_a, title: Printer jam }',
      '    - { _id: t2, organizationId: org_b, title: Leaking tap }',
      'users:',
      '  member: { id: u_1, roles: [member], organizationId: org_a }',
      '  admin: { id: u_2, roles: [admin], organizationId: org_a }',
      '  outsider: { id: u_9, roles: [member], organizationId: org_b }',
      '  guest: { id: u_3, roles: [], organizationId: org_a }',
      '',
    ].join('\n')
  );
  writeDataSet(
    'empty-org',
    'users:\n  member: { id: u_1, roles: [member], organizationId: org_a }\n'
  );
  writeDataSet('big-org', 'users:\n  someone: { id: u_5, roles: [member] }\n');
  fs.writeFileSync(journeysPath('tickets.yaml'), JSON.stringify(dataSetJourney));
  mockGet.mockImplementation(async (target) => {
    if (target.endsWith('/page-config/tickets')) {
      return { data: { ...pageConfig, auth: { public: false, roles: ['member', 'admin'] } } };
    }
    if (target.endsWith('/api/root')) return { data: { i18n: {} } };
    return { data: { buildId: 'build-1' } };
  });
  await variants({
    run: false,
    kinds: 'role,tenant,empty,volume',
    emptyData: 'empty-org',
    volumeData: 'big-org',
  });
  expect(process.exitCode).toBeUndefined();
  expect(listVariants()).toEqual([
    'member-opens-a-ticket-empty.yaml',
    'member-opens-a-ticket-role-1.yaml',
    'member-opens-a-ticket-role-2.yaml',
    'member-opens-a-ticket-tenant.yaml',
  ]);
  expect(logs.info).toContain('SKIPPED  volume: data set "big-org" has no user "member"');
  // The generated text below the header line, whose hash lets a rerun keep an edited file.
  const read = (name) =>
    fs
      .readFileSync(variantsPath(name), 'utf8')
      .replace(
        /^# Generated by lowdefy journeys variants from tests\/journeys\/tickets\.yaml \([0-9a-f]{12}\)\. A rerun keeps this file once it is edited\.\n\n/,
        ''
      );
  expect(read('member-opens-a-ticket-tenant.yaml')).toEqual(
    [
      'name: "member opens a ticket — tenant: as outsider of org_b"',
      'pageId: tickets',
      'user: outsider',
      'data: tickets',
      'variant:',
      '  of: member opens a ticket',
      '  kind: tenant',
      '  detail: as outsider of org_b',
      'steps:',
      '  - expect: { visible: { blockId: tickets_grid, containing: Leaking tap } }',
      '  - expect: { hidden: { blockId: tickets_grid, containing: Printer jam } }',
      '',
    ].join('\n')
  );
  expect(read('member-opens-a-ticket-role-2.yaml')).toEqual(
    [
      'name: "member opens a ticket — role: refused to guest"',
      'pageId: tickets',
      'user: guest',
      'data: tickets',
      'variant:',
      '  of: member opens a ticket',
      '  kind: role',
      '  detail: refused to guest',
      'steps:',
      '  - expect: { url: { contains: /404 } }',
      '  - expect: { hidden: tickets_grid }',
      '',
    ].join('\n')
  );
  expect(read('member-opens-a-ticket-role-1.yaml')).toContain('user: admin\n');
  expect(read('member-opens-a-ticket-role-1.yaml')).toContain('detail: granted to admin [admin]\n');
  expect(read('member-opens-a-ticket-empty.yaml')).toContain('data: empty-org\n');
  expect(read('member-opens-a-ticket-empty.yaml')).toContain(
    '  - expect: { visible: tickets_grid }\n'
  );
});

test('journeysVariants refuses an unreadable data set before it starts a server', async () => {
  fs.writeFileSync(journeysPath('tickets.yaml'), JSON.stringify(dataSetJourney));
  await variants({ run: false, url: undefined });
  expect(process.exitCode).toBe(1);
  expect(logs.error[0]).toMatch(/^Data set "tickets" not found in tests\/data/);
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockGet).not.toHaveBeenCalled();
});

test('journeysVariants keeps an edited variant on a rerun and says so', async () => {
  await variants({ run: false, kinds: 'double-submit' });
  const variantFile = variantsPath('saves-a-ticket-double-submit.yaml');
  const edited = `${fs.readFileSync(variantFile, 'utf8')}  - expect: { visible: done }\n`;
  fs.writeFileSync(variantFile, edited);
  await variants({ run: false, kinds: 'double-submit' });
  expect(fs.readFileSync(variantFile, 'utf8')).toBe(edited);
  expect(logs.warn).toContain(
    `KEPT     ${path.join(
      'tests',
      'journeys',
      '_candidates',
      'variants',
      'tickets',
      'saves-a-ticket-double-submit.yaml'
    )}: edited since it was generated; delete it to regenerate`
  );
});

test('journeysVariants reports a conflict for a journey whose name slugs like another journey of the file', async () => {
  const lookalike = { ...journey, name: 'Saves a ticket!' };
  fs.writeFileSync(journeysPath('tickets.yaml'), JSON.stringify([journey, lookalike]));
  await variants({ run: false, kinds: 'double-submit', name: 'saves a ticket' });
  const variantFile = variantsPath('saves-a-ticket-double-submit.yaml');
  const first = fs.readFileSync(variantFile, 'utf8');
  await variants({ run: false, kinds: 'double-submit', name: 'Saves a ticket!' });
  expect(process.exitCode).toBeUndefined();
  expect(fs.readFileSync(variantFile, 'utf8')).toBe(first);
  expect(logs.warn).toContain(
    `CONFLICT ${path.join(
      'tests',
      'journeys',
      '_candidates',
      'variants',
      'tickets',
      'saves-a-ticket-double-submit.yaml'
    )}: holds a variant of "saves a ticket" from ${path.join(
      'tests',
      'journeys',
      'tickets.yaml'
    )}; rename one of the journeys`
  );
});
