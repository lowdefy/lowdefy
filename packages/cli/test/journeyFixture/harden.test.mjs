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

import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// `lowdefy journeys harden` from the built CLI over the fixture app: the
// journey asserts the save message and nothing else.

const fixtureUrl = process.env.LOWDEFY_JOURNEY_FIXTURE_URL;
const configDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY;
const serverLog = process.env.LOWDEFY_JOURNEY_FIXTURE_LOG;
const fixtureTest = fixtureUrl === undefined ? test.skip : test;
const CLI = fileURLToPath(new URL('../../dist/index.js', import.meta.url));

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      env: { ...process.env, LOWDEFY_DISABLE_TELEMETRY: 'true' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => {
      stdout += data;
    });
    child.stderr.on('data', (data) => {
      stderr += data;
    });
    child.on('error', reject);
    child.on('exit', (code) => resolve({ code, stdout, stderr }));
  });
}

function hashJourneyFiles() {
  const directory = path.join(configDirectory, 'tests', 'journeys');
  return fs
    .readdirSync(directory)
    .sort()
    .map((name) => [
      name,
      crypto
        .createHash('sha1')
        .update(fs.readFileSync(path.join(directory, name)))
        .digest('hex'),
    ]);
}

fixtureTest(
  'harden kills the dropped save action and reports the unasserted alert as a survivor with its source line',
  async () => {
    const before = hashJourneyFiles();
    const { code, stdout, stderr } = await runCli([
      'journeys',
      'harden',
      '--config-directory',
      configDirectory,
      '--url',
      fixtureUrl,
      '--operators',
      'drop-action,drop-block',
      '--json',
      '--log-level',
      'error',
    ]);
    expect(stderr).toBe('');
    expect(code).toBe(0);
    const report = JSON.parse(stdout);
    const byDescribe = Object.fromEntries(
      report.mutants.map((mutant) => [mutant.describe, mutant])
    );
    const alert = byDescribe['drop-block Alert "unasserted_alert" from home'];
    expect(alert.status).toBe('survived');
    expect(alert.source).toMatch(/^pages\/home\.yaml:\d+$/);
    expect(alert.ranBy).toEqual([
      {
        file: 'tests/journeys/save.yaml',
        name: 'saves an item and sees the message',
        verdict: 'survived',
        failure: null,
        misses: [],
      },
    ]);
    const save = byDescribe['drop-action Request "save" (1 of 2) from save_button.onClick'];
    expect(save.status).toBe('killed');
    expect(save.ranBy[0].failure.index).toBe(2);
    expect(report.journeys).toEqual([
      {
        file: 'tests/journeys/save.yaml',
        name: 'saves an item and sees the message',
        killed: report.killed,
        total: report.total,
        unique: report.killed,
      },
    ]);
    expect(report.operators).toEqual(['drop-action', 'drop-block']);
    const written = JSON.parse(
      fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'mutation.json'), 'utf8')
    );
    expect(written).toEqual(report);
    expect(hashJourneyFiles()).toEqual(before);
  }
);

function countSaveCalls() {
  return fs.readFileSync(serverLog, 'utf8').split('requestId: save_item').length - 1;
}

// Resolves once the dev server has logged `more` save calls after `from`. The
// harden run's first save is its baseline's; the second is a mutant pair's, so
// by then the mutants are listed and pairs are running, on a fast machine or a
// slow one.
async function waitForSaveCalls({ from, more }) {
  const deadline = Date.now() + 120000;
  while (countSaveCalls() < from + more) {
    if (Date.now() > deadline) {
      throw new Error(`The harden run did not reach its mutant pairs. See ${serverLog}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

fixtureTest('harden carries its verdicts over a page edit mid-run and finishes', async () => {
  const pagePath = path.join(configDirectory, 'pages', 'second.yaml');
  const original = fs.readFileSync(pagePath, 'utf8');
  const savesBefore = countSaveCalls();
  const running = runCli([
    'journeys',
    'harden',
    '--config-directory',
    configDirectory,
    '--url',
    fixtureUrl,
    '--operators',
    'drop-block',
    '--workers',
    '1',
    '--json',
    '--log-level',
    'error',
  ]);
  try {
    // Once mutant pairs are running, the developer edits a page.
    await waitForSaveCalls({ from: savesBefore, more: 2 });
    fs.writeFileSync(pagePath, original.replace('content: Second page', 'content: Second page.'));
    const { code, stdout } = await running;
    expect(code).toBe(0);
    const report = JSON.parse(stdout);
    expect(report.rebuilds).toBe(1);
    // The journey never reads the edited page, so every verdict stands or
    // reran: none is lost.
    expect(report.mutants.every(({ status }) => ['killed', 'survived'].includes(status))).toBe(
      true
    );
  } finally {
    fs.writeFileSync(pagePath, original);
  }
});

const SHARED_JOURNEYS = {
  'shared_alpha.yaml': `- name: opens shared alpha
  pageId: shared_alpha
  data: harden
  user: member
  steps:
    - expect: { visible: shared_alpha_title }
`,
  'shared_beta.yaml': `- name: reads the shared notice on shared beta
  pageId: shared_beta
  data: harden
  user: member
  steps:
    - expect: { text: { blockId: shared_notice, contains: Shared notice } }
`,
};

// shared_notice is _ref'd into shared_alpha and shared_beta, so it is one
// mutant kept on shared_alpha. Only the shared_beta journey asserts it, so it
// is killed only when that journey runs it on shared_beta's copy.
fixtureTest(
  'harden runs a shared layout mutant on the copy a journey renders on a later page',
  async () => {
    const journeyDirectory = path.join(configDirectory, 'tests', 'journeys');
    const files = Object.keys(SHARED_JOURNEYS).map((name) => path.join(journeyDirectory, name));
    Object.entries(SHARED_JOURNEYS).forEach(([name, content]) =>
      fs.writeFileSync(path.join(journeyDirectory, name), content)
    );
    try {
      const { code, stdout, stderr } = await runCli([
        'journeys',
        'harden',
        ...files,
        '--config-directory',
        configDirectory,
        '--url',
        fixtureUrl,
        '--operators',
        'drop-block',
        '--json',
        '--log-level',
        'error',
      ]);
      expect(stderr).toBe('');
      expect(code).toBe(0);
      const report = JSON.parse(stdout);
      const notice = report.mutants.find(({ describe }) =>
        describe.startsWith('drop-block Paragraph "shared_notice"')
      );
      expect(notice.copies).toEqual(['shared_beta']);
      expect(notice.source).toMatch(/^pages\/shared\/notice\.yaml:\d+$/);
      expect(notice.status).toBe('killed');
      expect(
        notice.ranBy
          .map(({ file, verdict }) => [file, verdict])
          .sort((a, b) => a[0].localeCompare(b[0]))
      ).toEqual([
        ['tests/journeys/shared_alpha.yaml', 'survived'],
        ['tests/journeys/shared_beta.yaml', 'killed'],
      ]);
    } finally {
      files.forEach((file) => fs.rmSync(file, { force: true }));
    }
  }
);
