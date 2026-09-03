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

import reportJourneyCoverage from './reportJourneyCoverage.js';

let directory;

function createContext() {
  return {
    directories: { build: path.join(directory, 'build'), config: directory },
    logger: { info: jest.fn(), warn: jest.fn() },
  };
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-coverage-'));
  fs.mkdirSync(path.join(directory, 'build'));
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

function writeArtifact(coverage) {
  fs.writeFileSync(path.join(directory, 'build', 'journeyCoverage.json'), JSON.stringify(coverage));
}

test('reportJourneyCoverage prints the share and writes the page to journeys index', () => {
  writeArtifact({
    pages: {
      login: { events: [{ blockId: 'submit', event: 'onClick' }], requestIds: [] },
      users: { events: [{ blockId: 'refresh', event: 'onClick' }], requestIds: [] },
    },
  });
  const context = createContext();
  const coverage = reportJourneyCoverage({
    context,
    journeys: [{ journey: { name: 'sign in', pageId: 'login', steps: [{ click: 'submit' }] } }],
  });

  expect(coverage.covered).toBe(1);
  expect(context.logger.info.mock.calls[0][0]).toBe(
    'Journey coverage (static, declared config): 1/2 triples, 50%'
  );
  const indexPath = path.join(directory, '.lowdefy', 'test', 'journeyIndex.json');
  expect(JSON.parse(fs.readFileSync(indexPath, 'utf8'))).toEqual({
    pages: { login: ['sign in'] },
  });
});

test('reportJourneyCoverage warns and reports nothing when the build wrote no artifact', () => {
  const context = createContext();
  expect(reportJourneyCoverage({ context, journeys: [] })).toBeUndefined();
  expect(context.logger.warn).toHaveBeenCalledWith(
    'Journey coverage is unavailable: the build wrote no journeyCoverage.json. Run `lowdefy build` first.'
  );
  expect(fs.existsSync(path.join(directory, '.lowdefy'))).toBe(false);
});
