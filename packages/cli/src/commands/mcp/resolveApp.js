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

import findApps from './findApps.js';
import findGitRoot from './findGitRoot.js';

function hasLowdefyYaml(directory) {
  return ['lowdefy.yaml', 'lowdefy.yml'].some((name) => fs.existsSync(path.join(directory, name)));
}

// Which app a tool call means. The shim's working directory is the agent
// session's checkout, but a subagent working in another git worktree shares
// its parent's MCP connection - so an explicit directory always wins.
//
//   1. The app directory containing the start directory (it or an ancestor
//      below the checkout root holds lowdefy.yaml).
//   2. Otherwise the only app under the checkout root.
//   3. Otherwise an error listing the apps, so one failed call teaches the
//      agent which directory to pass.
function resolveApp({ directory, cwd }) {
  const start = path.resolve(cwd, directory ?? '.');
  if (!fs.existsSync(start)) {
    throw new Error(`Directory ${start} does not exist.`);
  }
  const startReal = fs.realpathSync(start);
  const root = findGitRoot({ directory: startReal });

  // Walk up to the checkout root, never past it.
  for (let current = startReal; ; current = path.dirname(current)) {
    if (hasLowdefyYaml(current)) {
      return { configDirectory: current, root };
    }
    if (current === root || current === path.dirname(current)) {
      break;
    }
  }

  const apps = findApps({ root });
  if (apps.length === 1) {
    return { configDirectory: apps[0], root };
  }
  if (apps.length === 0) {
    throw new Error(`No Lowdefy app (lowdefy.yaml) found in ${root}.`);
  }
  const list = apps.map((app) => `  - ${path.relative(root, app)}`).join('\n');
  throw new Error(
    `${root} holds several Lowdefy apps. Pass "directory" with the one you mean:\n${list}`
  );
}

export default resolveApp;
