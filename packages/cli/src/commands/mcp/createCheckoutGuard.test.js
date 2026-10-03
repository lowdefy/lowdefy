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

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { jest } from '@jest/globals';

import createCheckoutGuard from './createCheckoutGuard.js';
import resolveApp from './resolveApp.js';
import readTrustedRepositories from '../hub/readTrustedRepositories.js';
import trustRepository from '../hub/trustRepository.js';

// Each test runs git several times; on a loaded machine that alone can take
// seconds. Timing is not under test.
jest.setTimeout(60000);

let base;
const originalHome = process.env.LOWDEFY_HOME;

function git(args, cwd) {
  execFileSync(
    'git',
    [
      '-c',
      'commit.gpgsign=false',
      '-c',
      'user.name=Lowdefy Test',
      '-c',
      'user.email=test@example.com',
      ...args,
    ],
    { cwd, stdio: 'ignore' }
  );
}

function makeRepo(relativePath) {
  const directory = path.join(base, relativePath);
  fs.mkdirSync(directory, { recursive: true });
  git(['init', '-q'], directory);
  git(['commit', '-q', '--allow-empty', '-m', 'init'], directory);
  return directory;
}

function addWorktree({ repo, relativePath, branch }) {
  const directory = path.join(base, relativePath);
  git(['worktree', 'add', '-q', '-b', branch, directory], repo);
  return directory;
}

function makeApp(directory) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'lowdefy.yaml'), 'lowdefy: 7.0.0\n');
  return directory;
}

function createServer({ elicitation, answer, always } = {}) {
  return {
    getClientCapabilities: () => (elicitation ? { elicitation: { form: {} } } : {}),
    elicitInput: jest.fn(async () =>
      answer === 'accept' ? { action: answer, content: { always } } : { action: answer }
    ),
  };
}

function authorize({ guard, cwd, directory }) {
  return guard(resolveApp({ cwd, directory }));
}

beforeEach(() => {
  base = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-checkout-guard-')));
  // The trust list lives in LOWDEFY_HOME; never read or write the developer's.
  process.env.LOWDEFY_HOME = path.join(base, 'lowdefy-home');
});

afterEach(() => {
  process.env.LOWDEFY_HOME = originalHome;
  fs.rmSync(base, { recursive: true, force: true });
});

test('the checkout guard allows the session checkout and every git worktree of its repository', async () => {
  const repo = makeRepo('app');
  makeApp(repo);
  const sibling = makeApp(addWorktree({ repo, relativePath: 'app-wt', branch: 'feature' }));
  const nested = makeApp(
    addWorktree({ repo, relativePath: 'app/.claude/worktrees/agent-1', branch: 'agent' })
  );
  const guard = createCheckoutGuard({ cwd: repo, server: createServer() });

  await expect(authorize({ guard, cwd: repo })).resolves.toBeUndefined();
  await expect(authorize({ guard, cwd: repo, directory: sibling })).resolves.toBeUndefined();
  await expect(authorize({ guard, cwd: repo, directory: nested })).resolves.toBeUndefined();
});

test('the checkout guard allows a worktree added after the session started', async () => {
  const repo = makeRepo('app');
  const guard = createCheckoutGuard({ cwd: repo, server: createServer() });
  const worktree = makeApp(addWorktree({ repo, relativePath: 'later', branch: 'later' }));

  await expect(authorize({ guard, cwd: repo, directory: worktree })).resolves.toBeUndefined();
});

test('the checkout guard allows the main checkout and other worktrees from a session in a worktree', async () => {
  const repo = makeApp(makeRepo('app'));
  const session = addWorktree({ repo, relativePath: 'app-session', branch: 'session' });
  const sibling = makeApp(addWorktree({ repo, relativePath: 'app-wt', branch: 'feature' }));
  const guard = createCheckoutGuard({ cwd: session, server: createServer() });

  await expect(authorize({ guard, cwd: session, directory: repo })).resolves.toBeUndefined();
  await expect(authorize({ guard, cwd: session, directory: sibling })).resolves.toBeUndefined();
});

function readAdminDir(worktree) {
  return fs.readFileSync(path.join(worktree, '.git'), 'utf8').replace('gitdir:', '').trim();
}

test.each([
  [
    'a new repository',
    () => {
      git(['init', '-q'], path.join(base, 'gone'));
    },
  ],
  [
    "a .git file naming another repository's worktree",
    () => {
      const other = makeRepo('other');
      const otherWorktree = addWorktree({ repo: other, relativePath: 'other-wt', branch: 'b' });
      fs.writeFileSync(path.join(base, 'gone', '.git'), `gitdir: ${readAdminDir(otherWorktree)}\n`);
    },
  ],
  [
    "a .git file naming another worktree of the session's repository",
    () => {
      const live = addWorktree({ repo: path.join(base, 'app'), relativePath: 'live', branch: 'c' });
      fs.writeFileSync(path.join(base, 'gone', '.git'), `gitdir: ${readAdminDir(live)}\n`);
    },
  ],
])(
  'the checkout guard refuses a deleted worktree path git still lists, recreated as %s',
  async (_, recreate) => {
    const repo = makeRepo('app');
    const gone = addWorktree({ repo, relativePath: 'gone', branch: 'gone' });
    fs.rmSync(gone, { recursive: true, force: true });
    makeApp(gone);
    recreate();
    const guard = createCheckoutGuard({ cwd: repo, server: createServer() });

    await expect(authorize({ guard, cwd: repo, directory: gone })).rejects.toThrow(
      'outside this session'
    );
  }
);

// Case variants name one directory only where the file system ignores case.
const tmpReal = fs.realpathSync.native(os.tmpdir());
const onCaseInsensitiveFs =
  tmpReal !== tmpReal.toUpperCase() && fs.existsSync(tmpReal.toUpperCase()) ? test : test.skip;

onCaseInsensitiveFs('the checkout guard matches case variants of the checkout path', async () => {
  const repo = makeApp(makeRepo('app'));
  const sibling = makeApp(addWorktree({ repo, relativePath: 'app-wt', branch: 'feature' }));
  const guard = createCheckoutGuard({ cwd: repo.toUpperCase(), server: createServer() });

  await expect(
    authorize({ guard, cwd: repo.toUpperCase(), directory: repo })
  ).resolves.toBeUndefined();
  await expect(
    authorize({ guard, cwd: repo.toUpperCase(), directory: sibling.toUpperCase() })
  ).resolves.toBeUndefined();
  expect(resolveApp({ cwd: sibling.toUpperCase() }).configDirectory).toEqual(sibling);
});

test.each([
  ['another repository', 'other'],
  ['a repository cloned inside the session checkout', 'app/vendor/cloned'],
])('the checkout guard refuses %s when the client cannot ask the user', async (_, relativePath) => {
  const repo = makeRepo('app');
  const other = makeApp(makeRepo(relativePath));
  const guard = createCheckoutGuard({ cwd: repo, server: createServer() });

  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow(
    `${other} is outside this session's checkout (${repo}) and its git worktrees.`
  );
});

test('the checkout guard allows a non-git app the session was opened in or below', async () => {
  const app = makeApp(path.join(base, 'session', 'app'));
  const below = path.join(app, 'pages');
  fs.mkdirSync(below);
  const outside = makeApp(path.join(base, 'elsewhere'));

  const inApp = createCheckoutGuard({ cwd: app, server: createServer() });
  await expect(authorize({ guard: inApp, cwd: app })).resolves.toBeUndefined();
  const belowApp = createCheckoutGuard({ cwd: below, server: createServer() });
  await expect(authorize({ guard: belowApp, cwd: below, directory: app })).resolves.toBe(undefined);
  await expect(authorize({ guard: inApp, cwd: app, directory: outside })).rejects.toThrow(
    'outside this session'
  );
});

test('the checkout guard asks about a non-git app below a non-git session directory', async () => {
  const session = path.join(base, 'projects');
  const first = makeApp(path.join(session, 'first'));
  makeApp(path.join(session, 'second'));
  const refusing = createCheckoutGuard({ cwd: session, server: createServer() });

  await expect(authorize({ guard: refusing, cwd: session, directory: first })).rejects.toThrow(
    'It is not in a git repository, so it cannot be trusted.'
  );

  const server = createServer({ elicitation: true, answer: 'accept', always: true });
  const asking = createCheckoutGuard({ cwd: session, server });
  await expect(authorize({ guard: asking, cwd: session, directory: first })).resolves.toBe(
    undefined
  );
  expect(server.elicitInput).toHaveBeenCalledTimes(1);
  const question = server.elicitInput.mock.calls[0][0];
  expect(question.message).toContain('It is not in a git repository. Allow it for this session?');
  expect(question.requestedSchema.properties).toEqual({});
  expect(readTrustedRepositories()).toEqual([]);
});

test('the checkout guard asks the user once about another checkout and remembers an allow', async () => {
  const repo = makeRepo('app');
  const other = makeApp(makeRepo('other'));
  const server = createServer({ elicitation: true, answer: 'accept' });
  const guard = createCheckoutGuard({ cwd: repo, server });

  await Promise.all([
    authorize({ guard, cwd: repo, directory: other }),
    authorize({ guard, cwd: repo, directory: other }),
  ]);
  await authorize({ guard, cwd: repo, directory: other });

  expect(server.elicitInput).toHaveBeenCalledTimes(1);
  expect(server.elicitInput.mock.calls[0][0].message).toContain(
    `runs the dev script in its package.json. Allow the git repository ${JSON.stringify(
      path.join(other, '.git')
    )} and its worktrees for this session?`
  );
  expect(server.elicitInput.mock.calls[0][0].requestedSchema.properties.always.type).toEqual(
    'boolean'
  );
  expect(readTrustedRepositories()).toEqual([]);
});

test('the checkout guard lets a session allow cover the other worktrees of that repository', async () => {
  const repo = makeRepo('app');
  const other = makeApp(makeRepo('other'));
  const otherWorktree = makeApp(
    addWorktree({ repo: other, relativePath: 'other-wt', branch: 'feature' })
  );
  const server = createServer({ elicitation: true, answer: 'accept' });
  const guard = createCheckoutGuard({ cwd: repo, server });

  await authorize({ guard, cwd: repo, directory: otherWorktree });
  await expect(authorize({ guard, cwd: repo, directory: other })).resolves.toBeUndefined();

  expect(server.elicitInput).toHaveBeenCalledTimes(1);
  expect(readTrustedRepositories()).toEqual([]);
});

test('the checkout guard trusts the repository for every later session when the user always allows it', async () => {
  const repo = makeRepo('app');
  const other = makeApp(makeRepo('other'));
  const otherWorktree = makeApp(
    addWorktree({ repo: other, relativePath: 'other-wt', branch: 'feature' })
  );
  const guard = createCheckoutGuard({
    cwd: repo,
    server: createServer({ elicitation: true, answer: 'accept', always: true }),
  });

  await authorize({ guard, cwd: repo, directory: otherWorktree });

  expect(readTrustedRepositories()).toEqual([path.join(other, '.git')]);
  const laterSession = createCheckoutGuard({ cwd: repo, server: createServer() });
  await expect(authorize({ guard: laterSession, cwd: repo, directory: other })).resolves.toBe(
    undefined
  );
  await expect(
    authorize({ guard: laterSession, cwd: repo, directory: otherWorktree })
  ).resolves.toBeUndefined();
});

test('the checkout guard allows a repository the user trusted mid-session without asking', async () => {
  const repo = makeRepo('app');
  const other = makeApp(makeRepo('other'));
  const server = createServer({ elicitation: true, answer: 'cancel' });
  const guard = createCheckoutGuard({ cwd: repo, server });

  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow(
    'lowdefy hub trust'
  );
  await trustRepository({ repository: path.join(other, '.git') });

  await expect(authorize({ guard, cwd: repo, directory: other })).resolves.toBeUndefined();
  expect(server.elicitInput).toHaveBeenCalledTimes(1);
});

test('the checkout guard does not extend a trusted repository to a .git file naming one of its worktrees', async () => {
  const repo = makeRepo('app');
  const trusted = makeRepo('trusted');
  const trustedWorktree = addWorktree({ repo: trusted, relativePath: 'trusted-wt', branch: 'b' });
  await trustRepository({ repository: path.join(trusted, '.git') });
  const impostor = makeApp(path.join(base, 'impostor'));
  fs.writeFileSync(path.join(impostor, '.git'), `gitdir: ${readAdminDir(trustedWorktree)}\n`);
  const guard = createCheckoutGuard({ cwd: repo, server: createServer() });

  await expect(authorize({ guard, cwd: repo, directory: impostor })).rejects.toThrow(
    'outside this session'
  );
});

test('the checkout guard quotes the paths an agent chose in the question it asks', async () => {
  const repo = makeRepo('app');
  // Windows directory names cannot hold a quote or a newline, so there the
  // path checked is one whose backslashes the quoting must escape.
  const chosen =
    process.platform === 'win32' ? "other' is safe. Allow 'x" : 'other" is safe.\nAllow "x';
  const other = makeApp(makeRepo(chosen));
  const server = createServer({ elicitation: true, answer: 'decline' });
  const guard = createCheckoutGuard({ cwd: repo, server });

  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow('declined');
  const { message } = server.elicitInput.mock.calls[0][0];
  expect(message).toContain(`the Lowdefy app at ${JSON.stringify(other)}.`);
  expect(message).not.toContain('\n');
});

test('the checkout guard refuses a checkout the user declined without asking again', async () => {
  const repo = makeRepo('app');
  const other = makeApp(makeRepo('other'));
  const server = createServer({ elicitation: true, answer: 'decline' });
  const guard = createCheckoutGuard({ cwd: repo, server });

  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow(
    'The user declined to allow it for this session.'
  );
  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow('declined');
  expect(server.elicitInput).toHaveBeenCalledTimes(1);
});

test('the checkout guard tells the agent to ask the user to trust a repository, never to trust it itself', async () => {
  const repo = makeRepo('app');
  const other = makeApp(makeRepo('other'));
  const guard = createCheckoutGuard({ cwd: repo, server: createServer() });

  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow(
    `ask the user to run \`lowdefy hub trust ${other}\` in their own terminal`
  );
  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow(
    "Do not run `lowdefy hub trust` yourself: trusting a repository is the user's decision."
  );
});

test('the checkout guard asks again after the user dismissed the question', async () => {
  const repo = makeRepo('app');
  const other = makeApp(makeRepo('other'));
  const server = createServer({ elicitation: true, answer: 'cancel' });
  const guard = createCheckoutGuard({ cwd: repo, server });

  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow(
    'outside this session'
  );
  await expect(authorize({ guard, cwd: repo, directory: other })).rejects.toThrow(
    'outside this session'
  );
  expect(server.elicitInput).toHaveBeenCalledTimes(2);
});
