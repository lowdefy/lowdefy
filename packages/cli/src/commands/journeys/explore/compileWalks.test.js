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

import { jest } from '@jest/globals';

const mockReadRecordings = jest.fn();
const mockCompileTrace = jest.fn();
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  compileTrace: mockCompileTrace,
  readRecordings: mockReadRecordings,
}));

const { default: compileWalks } = await import('./compileWalks.js');

const run = '20261004T120000Z-ab12cd';
const scope = {
  pages: [
    {
      pageId: 'ticket',
      blocks: [
        { blockId: 'assign_submit', change: 'added' },
        { blockId: 'old', change: 'removed' },
      ],
    },
  ],
};
const finding = { kind: 'action-error', message: 'CallAPI failed', source: 'pages/ticket.yaml:88' };
let configDirectory;

function record(session, walk) {
  return { session, source: 'explorer', run: { id: run, journey: walk } };
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-compile-'));
  mockReadRecordings.mockReturnValue([
    record('s1', 'walk-1'),
    record('s1', 'walk-1'),
    record('s2', 'walk-2'),
    record('s3', 'walk-3'),
  ]);
  // Each partition yields one candidate per session, through prepareCandidate.
  mockCompileTrace.mockImplementation(({ records, prepareCandidate }) => {
    const sessions = [...new Set(records.map((entry) => entry.session))];
    const candidates = sessions
      .map((session) => {
        const steps =
          session === 's3'
            ? [{ click: 'old' }]
            : [
                { fill: { blockId: 'title', value: 'Explorer title 0' } },
                { expect: { state: { path: 'customer', equals: 'Staging Customer Ltd' } } },
                { click: { blockId: 'assign_submit', text: 'Assign' } },
              ];
        const prepared = prepareCandidate({
          journey: { pageId: 'ticket', steps },
          origin: { source: 'explorer' },
          comments: new Map(),
          sessions: [session],
        });
        if (prepared === null) return null;
        return {
          fileName: `ticket-${session}.yaml`,
          contents: JSON.stringify(prepared.journey) + JSON.stringify(prepared.origin),
        };
      })
      .filter((candidate) => candidate !== null);
    return { candidates };
  });
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
  jest.clearAllMocks();
});

test('walks with a confirmed finding compile into findings/, the rest into explorer/, only candidates touching the change kept', () => {
  const result = compileWalks({
    configDirectory,
    run,
    pr: { number: 2531 },
    scope,
    buildDirectory: undefined,
    findingsByWalk: new Map([['walk-1', finding]]),
    snapshot: false,
    knownTextFor: () => ({ has: () => false }),
  });
  const base = path.join(configDirectory, 'tests', 'journeys', '_candidates', 'explorer');
  expect(result.finding).toEqual([path.join(base, 'findings', 'ticket-s1.yaml')]);
  expect(result.coverage).toEqual([path.join(base, 'ticket-s2.yaml')]);
  expect(mockReadRecordings).toHaveBeenCalledWith({ configDirectory, source: 'explorer', run });
  const findingContents = fs.readFileSync(result.finding[0], 'utf8');
  expect(findingContents).toContain(
    JSON.stringify({ source: 'explorer', explorer: { run, pr: 2531, walks: ['walk-1'], finding } })
  );
  const coverageContents = fs.readFileSync(result.coverage[0], 'utf8');
  expect(coverageContents).toContain('"walks":["walk-2"]');
  expect(coverageContents).toContain('Staging Customer Ltd');
});

test('on a snapshot data set, an expectation holding a snapshot value is dropped before writing', () => {
  const result = compileWalks({
    configDirectory,
    run,
    pr: null,
    scope,
    buildDirectory: undefined,
    findingsByWalk: new Map(),
    snapshot: true,
    knownTextFor: () => ({ has: () => false }),
  });
  expect(result.droppedExpectations).toBe(2);
  result.coverage.forEach((file) => {
    expect(fs.readFileSync(file, 'utf8')).not.toContain('Staging Customer Ltd');
  });
});
