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
import path from 'path';

import findGitRoot from './findGitRoot.js';
import findRepositoryKey from './findRepositoryKey.js';
import listSessionCheckouts from './listSessionCheckouts.js';
import readTrustedRepositories from '../hub/readTrustedRepositories.js';
import trustRepository from '../hub/trustRepository.js';

// The user answers in their client; give them time to read the question.
const ASK_TIMEOUT_MS = 5 * 60 * 1000;

function isInside({ directory, parent }) {
  const relative = path.relative(parent, directory);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

// Starting a dev server runs the app's package.json dev script, and the user
// approved these tools once, for the checkout they opened the session in. So a
// tool call may act on that checkout and the repository's other git worktrees
// (where subagents work), and on repositories the user trusts for every
// session (`lowdefy hub trust`), and nothing else: an agent must not be able to
// run the scripts of a repository it just cloned through these tools without
// the user seeing it. This is consent on the tool path, not a sandbox. A
// directory outside is put to the user as an MCP elicitation when the client
// supports one, and refused otherwise. The answer holds for the session and
// for the whole repository, or for good when the user ticks "always allow".
function createCheckoutGuard({ cwd, server }) {
  const sessionDirectory = fs.realpathSync.native(cwd);
  const sessionRoot = findGitRoot({ directory: sessionDirectory });
  const answers = new Map();

  async function isSessionCheckout({ configDirectory, root }) {
    // Outside git, only the app the session was opened in (or below) is its
    // own: a session opened above several projects does not own them all.
    if (!fs.existsSync(path.join(root, '.git'))) {
      return isInside({ directory: sessionDirectory, parent: configDirectory });
    }
    if (root === sessionRoot) {
      return true;
    }
    return (await listSessionCheckouts({ sessionRoot })).includes(root);
  }

  function buildQuestion({ configDirectory, repository }) {
    // The paths come from the agent, so they are quoted: a directory name
    // cannot pass for part of the question.
    const asked = `An agent asked lowdefy mcp to use the Lowdefy app at ${JSON.stringify(
      configDirectory
    )}. It is outside this session's checkout (${JSON.stringify(
      sessionRoot
    )}) and its git worktrees. Allowing it lets the agent start that app's dev server, which runs the dev script in its package.json.`;
    if (repository === null) {
      return {
        message: `${asked} It is not in a git repository. Allow it for this session?`,
        requestedSchema: { type: 'object', properties: {} },
      };
    }
    return {
      message: `${asked} Allow the git repository ${JSON.stringify(
        repository
      )} and its worktrees for this session?`,
      requestedSchema: {
        type: 'object',
        properties: {
          always: {
            type: 'boolean',
            title: 'Always allow this repository',
            description:
              'Allow it, and all of its git worktrees, in every agent session from now on. Undo with `lowdefy hub untrust`.',
            default: false,
          },
        },
      },
    };
  }

  async function askUser({ configDirectory, repository }) {
    if (!server.getClientCapabilities()?.elicitation?.form) {
      return { action: 'unsupported' };
    }
    try {
      const result = await server.elicitInput(buildQuestion({ configDirectory, repository }), {
        timeout: ASK_TIMEOUT_MS,
      });
      return { action: result.action, always: result.content?.always === true };
    } catch {
      return { action: 'cancel' };
    }
  }

  async function decide({ app, repository, answerKey }) {
    const { action, always } = await askUser({ ...app, repository });
    if (action === 'accept') {
      if (always && repository !== null) {
        await trustRepository({ repository });
      }
      return { allowed: true };
    }
    // A dismissed question is asked again on the next call; a declined one
    // is not, so an agent cannot keep asking.
    if (action !== 'decline') {
      answers.delete(answerKey);
    }
    return { allowed: false, action };
  }

  function refuse({ app, repository, action }) {
    const where = `${app.configDirectory} is outside this session's checkout (${sessionRoot}) and its git worktrees.`;
    if (action === 'decline') {
      return new Error(`${where} The user declined to allow it for this session.`);
    }
    const rule =
      'lowdefy mcp only starts and queries the dev servers of apps in the checkout the agent session was started in, in a git worktree of that repository, or in a repository the user trusts.';
    if (repository === null) {
      return new Error(
        `${where} ${rule} It is not in a git repository, so it cannot be trusted. Work in this checkout or one of its worktrees, or ask the user to start an agent session in ${app.configDirectory}.`
      );
    }
    return new Error(
      `${where} ${rule} Work in this checkout or one of its worktrees, or ask the user to run \`lowdefy hub trust ${app.root}\` in their own terminal (it covers every agent session) or to start an agent session in ${app.root}. Do not run \`lowdefy hub trust\` yourself: trusting a repository is the user's decision.`
    );
  }

  return async function authorizeApp(app) {
    if (await isSessionCheckout(app)) {
      return;
    }
    const repository = findRepositoryKey({ root: app.root });
    // Read on every call: the user may trust a repository mid-session.
    if (repository !== null && readTrustedRepositories().includes(repository)) {
      return;
    }
    // Keyed like the trust list, so an answer covers the repository's other
    // worktrees too.
    const answerKey = repository ?? app.root;
    if (!answers.has(answerKey)) {
      answers.set(answerKey, decide({ app, repository, answerKey }));
    }
    const { allowed, action } = await answers.get(answerKey);
    if (allowed) {
      return;
    }
    throw refuse({ app, repository, action });
  };
}

export default createCheckoutGuard;
