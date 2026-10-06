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

// `lowdefy journeys scope` from the built CLI, end to end: a temporary git
// repository holds a copy of the fixture app whose second commit fills in
// the explore_pr page. The scope builds both revisions with the fixture's
// installed dev server builder and talks to no dev server.

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

function sharedPage(pageId) {
  return `id: ${pageId}
type: Box
blocks:
  - _ref: shared/notice.yaml
`;
}

function notice(message) {
  return `id: shared_notice
type: Alert
properties:
  message: ${message}
`;
}

// A few of the fixture's data set users; every data set under tests/data is
// read, so the full list grows with the fixture.
const FIXTURE_USERS = [
  { dataSet: 'explore', user: 'member', roles: ['member'] },
  { dataSet: 'personas', user: 'admin', roles: ['admin'] },
  { dataSet: 'rails', user: 'member', roles: ['member'] },
];

let repository;
let appDirectory;

function git(args) {
  execFileSync(
    'git',
    ['-c', 'user.name=Scope Test', '-c', 'user.email=scope@example.com', ...args],
    { cwd: repository, stdio: 'ignore' }
  );
}

function commit(message) {
  git(['add', '.']);
  git(['commit', '-q', '-m', message]);
}

function makeRepository() {
  repository = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-scope-e2e-'));
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
  commit('base');
  fs.writeFileSync(pagePath, headPage);
  commit('Add the note form and assignment');
}

function runCli(args) {
  const env = { ...process.env, LOWDEFY_DISABLE_TELEMETRY: 'true' };
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

function scopeArgs(extra = []) {
  return [
    'journeys',
    'scope',
    '--config-directory',
    appDirectory,
    '--dev-directory',
    DEV_DIRECTORY,
    '--log-level',
    'error',
    ...extra,
  ];
}

beforeAll(() => {
  if (fixtureUrl !== undefined) makeRepository();
});

afterAll(() => {
  if (repository !== undefined) fs.rmSync(repository, { recursive: true, force: true });
});

fixtureTest(
  'scope --base lists the page the commit changed, with why and who can open it, and nothing else',
  async () => {
    const { code, stdout, stderr } = await runCli(scopeArgs(['--base', 'HEAD~1', '--json']));
    expect(stderr).toBe('');
    expect(code).toBe(0);
    const scope = JSON.parse(stdout);
    expect(scope.dirty).toBe(false);
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
    expect(scope.pages[0].roles).toEqual({
      access: 'public',
      roles: [],
      users: expect.arrayContaining(FIXTURE_USERS),
    });
    // The scope writes nothing but its caches: no run directory is kept.
    expect(fs.readdirSync(path.join(appDirectory, '.lowdefy', 'scope')).sort()).toEqual([
      'builds',
      'trees',
    ]);
  }
);

fixtureTest('scope --base lists every page that refs a changed _ref file', async () => {
  const lowdefyPath = path.join(appDirectory, 'lowdefy.yaml');
  const lowdefy = fs.readFileSync(lowdefyPath, 'utf8');
  const lastPage = '  - _ref: pages/targets.yaml\n';
  expect(lowdefy).toContain(lastPage);
  fs.writeFileSync(
    lowdefyPath,
    lowdefy.replace(
      lastPage,
      `${lastPage}  - _ref: pages/scope_a.yaml\n  - _ref: pages/scope_b.yaml\n`
    )
  );
  fs.writeFileSync(path.join(appDirectory, 'pages', 'scope_a.yaml'), sharedPage('scope_a'));
  fs.writeFileSync(path.join(appDirectory, 'pages', 'scope_b.yaml'), sharedPage('scope_b'));
  fs.mkdirSync(path.join(appDirectory, 'shared'));
  fs.writeFileSync(path.join(appDirectory, 'shared', 'notice.yaml'), notice('Before'));
  commit('Add two pages that share a notice');
  fs.writeFileSync(path.join(appDirectory, 'shared', 'notice.yaml'), notice('After'));
  commit('Change the shared notice');

  const { code, stdout, stderr } = await runCli(scopeArgs(['--base', 'HEAD~1', '--json']));
  expect(stderr).toBe('');
  expect(code).toBe(0);
  const scope = JSON.parse(stdout);
  expect(scope.pages.map((page) => [page.pageId, page.reasons])).toEqual([
    ['scope_a', ['page']],
    ['scope_b', ['page']],
  ]);
  scope.pages.forEach((page) => {
    expect(page.blocks).toEqual([
      expect.objectContaining({
        blockId: 'shared_notice',
        change: 'changed',
        source: expect.stringMatching(/shared\/notice\.yaml:\d+$/),
      }),
    ]);
  });
});

fixtureTest(
  'scope with uncommitted changes includes them, and prints the summary without --json',
  async () => {
    fs.writeFileSync(path.join(appDirectory, 'shared', 'notice.yaml'), notice('Uncommitted'));
    const { code, stdout, stderr } = await runCli([
      'journeys',
      'scope',
      '--base',
      'HEAD',
      '--config-directory',
      appDirectory,
      '--dev-directory',
      DEV_DIRECTORY,
    ]);
    expect(code).toBe(0);
    // The CLI logger writes its lines to stderr when it is not a TTY.
    const output = `${stdout}${stderr}`;
    expect(output).toContain('uncommitted changes included');
    expect(output).toContain('scope_a (page)');
    expect(output).toMatch(
      /scope_a: public; users explore\/member, .*personas\/admin, .*rails\/member/
    );
    git(['checkout', '--', '.']);
  }
);
