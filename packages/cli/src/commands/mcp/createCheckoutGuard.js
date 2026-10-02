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
import findMainCheckout from './findMainCheckout.js';
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
// run the scripts of a repository it just cloned without the user seeing it. A
// directory outside is put to the user as an MCP elicitation when the client
// supports one, and refused otherwise. The answer holds for the session, or
// for good when the user ticks "always allow".
function createCheckoutGuard({ cwd, server }) {
  const sessionRoot = findGitRoot({ directory: fs.realpathSync.native(cwd) });
  const answers = new Map();

  async function isSessionCheckout({ configDirectory, root }) {
    if (!fs.existsSync(path.join(root, '.git'))) {
      return isInside({ directory: configDirectory, parent: sessionRoot });
    }
    if (root === sessionRoot) {
      return true;
    }
    return (await listSessionCheckouts({ sessionRoot })).includes(root);
  }

  async function askUser({ configDirectory, repository }) {
    if (!server.getClientCapabilities()?.elicitation?.form) {
      return { action: 'unsupported' };
    }
    try {
      const result = await server.elicitInput(
        {
          // The paths come from the agent, so they are quoted: a directory
          // name cannot pass for part of the question.
          message: `An agent asked lowdefy mcp to use the Lowdefy app at ${JSON.stringify(
            configDirectory
          )}. It is outside this session's checkout (${JSON.stringify(
            sessionRoot
          )}) and its git worktrees. Allowing it lets the agent start that app's dev server, which runs the dev script in its package.json. Allow the repository ${JSON.stringify(
            repository
          )}?`,
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
        },
        { timeout: ASK_TIMEOUT_MS }
      );
      return { action: result.action, always: result.content?.always === true };
    } catch {
      return { action: 'cancel' };
    }
  }

  async function decide(app) {
    const repository = findMainCheckout({ root: app.root });
    const { action, always } = await askUser({ ...app, repository });
    if (action === 'accept') {
      if (always) {
        trustRepository({ repository });
      }
      return { allowed: true };
    }
    // A dismissed question is asked again on the next call; a declined one
    // is not, so an agent cannot keep asking.
    if (action !== 'decline') {
      answers.delete(app.root);
    }
    return { allowed: false, action };
  }

  return async function authorizeApp(app) {
    if (await isSessionCheckout(app)) {
      return;
    }
    // Read on every call: the user may trust a repository mid-session.
    if (readTrustedRepositories().includes(findMainCheckout({ root: app.root }))) {
      return;
    }
    if (!answers.has(app.root)) {
      answers.set(app.root, decide(app));
    }
    const { allowed, action } = await answers.get(app.root);
    if (allowed) {
      return;
    }
    const where = `${app.configDirectory} is outside this session's checkout (${sessionRoot}) and its git worktrees.`;
    if (action === 'decline') {
      throw new Error(`${where} The user declined to allow it for this session.`);
    }
    throw new Error(
      `${where} lowdefy mcp only starts and queries the dev servers of apps in the checkout the agent session was started in, in a git worktree of that repository, or in a repository the user trusts. Work in this checkout or one of its worktrees, or ask the user to run \`lowdefy hub trust ${app.root}\` (it covers every agent session) or to start an agent session in ${app.root}.`
    );
  };
}

export default createCheckoutGuard;
