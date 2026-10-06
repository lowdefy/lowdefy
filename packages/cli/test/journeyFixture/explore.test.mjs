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

import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// `lowdefy journeys explore` from the built CLI, end to end: a temporary git
// repository holds a copy of the fixture app whose second commit adds the
// explore_pr page (a button whose CallAPI fails, a note form whose save
// works). The walks run on the fixture's dev server, which serves the head.

const fixtureUrl = process.env.LOWDEFY_JOURNEY_FIXTURE_URL;
const fixtureDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY;
const fixtureTest = fixtureUrl === undefined ? test.skip : test;
const CLI = fileURLToPath(new URL('../../dist/index.js', import.meta.url));
const REPO_ROOT = path.resolve(path.dirname(CLI), '../../..');
const DEV_DIRECTORY = path.join(REPO_ROOT, '_server', 'dev-journey-fixture');

const BASE_PAGE = `id: explore_pr
type: Box
blocks:
  - id: explore_pr_title
    type: Title
    properties:
      content: Notes
      level: 2
`;

let repository;
let appDirectory;

function git(args) {
  execFileSync(
    'git',
    ['-c', 'user.name=Explorer Test', '-c', 'user.email=explorer@example.com', ...args],
    {
      cwd: repository,
      stdio: 'ignore',
    }
  );
}

function makeRepository() {
  repository = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-e2e-'));
  appDirectory = path.join(repository, 'app');
  fs.cpSync(fixtureDirectory, appDirectory, {
    recursive: true,
    filter: (source) => !source.split(path.sep).includes('.lowdefy'),
  });
  fs.writeFileSync(path.join(repository, '.gitignore'), '.lowdefy\n');
  const pagePath = path.join(appDirectory, 'pages', 'explore_pr.yaml');
  const headPage = fs.readFileSync(pagePath, 'utf8');
  fs.writeFileSync(pagePath, BASE_PAGE);
  git(['init', '-q']);
  git(['add', '.']);
  git(['commit', '-q', '-m', 'base']);
  fs.writeFileSync(pagePath, headPage);
  git(['add', '.']);
  git(['commit', '-q', '-m', 'Add the note form and assignment']);
  // The walks run on the fixture's dev server, which records into the
  // fixture app's traces: the copy reads them from there.
  fs.mkdirSync(path.join(fixtureDirectory, '.lowdefy', 'traces'), { recursive: true });
  fs.mkdirSync(path.join(appDirectory, '.lowdefy'), { recursive: true });
  fs.symlinkSync(
    path.join(fixtureDirectory, '.lowdefy', 'traces'),
    path.join(appDirectory, '.lowdefy', 'traces'),
    'dir'
  );
}

function runCli(args) {
  const env = { ...process.env, LOWDEFY_DISABLE_TELEMETRY: 'true' };
  // No test calls a real model: the seeded policy, and no Gateway key.
  delete env.AI_GATEWAY_API_KEY;
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], { env });
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

function readRunDirectory() {
  const exploreDirectory = path.join(appDirectory, '.lowdefy', 'explore');
  const runs = fs
    .readdirSync(exploreDirectory)
    .filter((name) => /^\d{8}T\d{6}Z-[a-z0-9]{6}$/.test(name))
    .sort();
  return path.join(exploreDirectory, runs[runs.length - 1]);
}

function readWalks(runDirectory) {
  return fs
    .readFileSync(path.join(runDirectory, 'walks.jsonl'), 'utf8')
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => JSON.parse(line));
}

beforeAll(() => {
  if (fixtureUrl !== undefined) makeRepository();
});

afterAll(() => {
  if (repository !== undefined) fs.rmSync(repository, { recursive: true, force: true });
});

function exploreArgs(extra = []) {
  return [
    'journeys',
    'explore',
    '--against',
    'HEAD~1',
    '--policy',
    'seeded',
    '--data',
    'explore',
    '--config-directory',
    appDirectory,
    '--dev-directory',
    DEV_DIRECTORY,
    '--url',
    fixtureUrl,
    '--walks',
    '3',
    // Short walks, so a walk that does not reach the failing button within
    // its steps becomes a coverage candidate.
    '--steps',
    '3',
    '--budget',
    '4m',
    '--log-level',
    'error',
    ...extra,
  ];
}

fixtureTest(
  'explore --scope-only targets the page the commit changed and walks nothing',
  async () => {
    const { code, stdout, stderr } = await runCli(exploreArgs(['--scope-only', '--json']));
    expect(stderr).toBe('');
    expect(code).toBe(0);
    const scope = JSON.parse(stdout);
    expect(scope.pages.map((page) => [page.pageId, page.reasons])).toEqual([
      ['explore_pr', ['page', 'request:save_note']],
    ]);
    expect(scope.pages[0].blocks.map((block) => [block.blockId, block.change])).toEqual(
      expect.arrayContaining([
        ['assign_submit', 'added'],
        ['note_input', 'added'],
        ['save_note_button', 'added'],
      ])
    );
    expect(fs.existsSync(path.join(readRunDirectory(), 'walks.jsonl'))).toBe(false);
  }
);

// What a seeded walk did, without what differs between runs (ids, times,
// durations, screenshot paths).
function walkShape(walk) {
  return {
    walk: walk.walk,
    pageId: walk.pageId,
    user: walk.user,
    stopReason: walk.stopReason,
    steps: walk.steps.map((step) => ({
      step: step.step,
      options: step.options,
      answer: step.answer.optionId,
      findings: step.findings.map((finding) => finding.key),
    })),
  };
}

function readCandidates(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith('.yaml'))
    .map((name) => path.join(directory, name));
}

fixtureTest(
  'explore proves the failing click by a journey that fails under lowdefy test, writes a coverage candidate that passes three runs, and seeded runs repeat',
  async () => {
    const first = await runCli(exploreArgs(['--json']));
    expect(first.stderr).toBe('');
    expect(first.code).toBe(0);
    const report = JSON.parse(first.stdout);
    const runDirectory = readRunDirectory();
    expect(path.basename(runDirectory)).toBe(report.run);
    const walks = readWalks(runDirectory);
    expect(walks.length).toBeGreaterThanOrEqual(3);
    walks.forEach((walk) => {
      expect(walk.pageId).toBe('explore_pr');
      expect(walk.user).toBe('member');
    });

    const findings = JSON.parse(fs.readFileSync(path.join(runDirectory, 'findings.json'), 'utf8'));
    const actionErrors = findings.filter((finding) => finding.kind === 'action-error');
    expect(actionErrors).toHaveLength(1);
    expect(actionErrors[0].status).toBe('proven');
    expect(actionErrors[0].source).toMatch(/\.yaml:\d+$/);
    expect(report.findings.proven.map((finding) => finding.key)).toContain(actionErrors[0].key);
    expect(report.proof.live).toBe(false);

    const candidatesDirectory = path.join(
      appDirectory,
      'tests',
      'journeys',
      '_candidates',
      'explorer',
      report.run
    );
    const findingCandidate = path.join(appDirectory, actionErrors[0].candidate);
    expect(path.dirname(findingCandidate)).toBe(path.join(candidatesDirectory, 'findings'));
    expect(readCandidates(path.join(candidatesDirectory, 'findings'))).toHaveLength(
      report.findings.proven.length
    );
    const findingContents = fs.readFileSync(findingCandidate, 'utf8');
    expect(findingContents).toContain('assign_submit');
    expect(findingContents).toContain('data: explore');
    expect(findingContents).toContain('user: member');
    expect(findingContents).toMatch(/explorer:\n#\s+run: /);
    expect(findingContents).toMatch(/kind: action-error/);
    // The proof is a journey that fails: lowdefy test runs it and fails.
    const proofRun = await runCli([
      'test',
      findingCandidate,
      '--config-directory',
      appDirectory,
      '--url',
      fixtureUrl,
      '--log-level',
      'error',
    ]);
    expect(proofRun.code).toBe(1);

    const coverageCandidates = readCandidates(candidatesDirectory);
    expect(coverageCandidates.length).toBeGreaterThanOrEqual(1);
    const results = [];
    for (const candidate of coverageCandidates) {
      results.push(
        await runCli([
          'test',
          candidate,
          '--repeat',
          '3',
          '--config-directory',
          appDirectory,
          '--url',
          fixtureUrl,
          '--log-level',
          'error',
        ])
      );
    }
    expect(results.some((result) => result.code === 0)).toBe(true);

    const second = await runCli(exploreArgs(['--json']));
    expect(second.code).toBe(0);
    const again = readWalks(readRunDirectory());
    expect(again.map(walkShape)).toEqual(walks.map(walkShape));
  }
);

fixtureTest(
  'explore proves an onInit app error at open by the one-step page root journey, which fails on open under lowdefy test',
  async () => {
    const explored = await runCli(exploreArgs(['--page', 'app_errors_open', '--json']));
    expect(explored.stderr).toBe('');
    expect(explored.code).toBe(0);
    const report = JSON.parse(explored.stdout);
    const runDirectory = readRunDirectory();
    const openWalks = readWalks(runDirectory).filter((walk) => walk.pageId === 'app_errors_open');
    expect(openWalks.length).toBeGreaterThanOrEqual(1);
    openWalks.forEach((walk) => {
      expect(walk.stopReason).toBe('finding');
      expect(walk.steps).toEqual([]);
    });

    const findings = JSON.parse(fs.readFileSync(path.join(runDirectory, 'findings.json'), 'utf8'));
    const openErrors = findings.filter(
      (finding) => finding.pageId === 'app_errors_open' && finding.kind === 'server-error'
    );
    expect(openErrors).toHaveLength(1);
    expect(openErrors[0].status).toBe('proven');
    expect(openErrors[0].step).toBeNull();
    expect(report.findings.proven.map((finding) => finding.key)).toContain(openErrors[0].key);

    const candidate = path.join(appDirectory, openErrors[0].candidate);
    const contents = fs.readFileSync(candidate, 'utf8');
    expect(contents).toContain('visible: app_errors_open');
    expect(contents).toContain('data: explore');
    expect(contents).toContain('user: member');
    const proofRun = await runCli([
      'test',
      candidate,
      '--config-directory',
      appDirectory,
      '--url',
      fixtureUrl,
    ]);
    expect(proofRun.code).toBe(1);
    expect(`${proofRun.stdout}${proofRun.stderr}`).toContain('on open');
  }
);
