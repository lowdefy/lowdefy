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

import path from 'node:path';
import { pathToFileURL } from 'node:url';

const pinBuildInputsUrl = pathToFileURL(path.join(import.meta.dirname, 'pinBuildInputs.mjs')).href;

// The caller's environment passes through (an app may need
// LOWDEFY_ENVIRONMENT or its own variables), with the inputs that would
// otherwise differ between two builds of the same code pinned:
// - LOWDEFY_GIT_SHA: the build reads the git sha of the directory it runs in,
//   each side's own checkout, unless this is set.
// - the buildId, through the pinBuildInputs preload.
// - CI: it switches the CLI to plain output, which drops the level of each
//   line, and the build's warnings and errors are read from that output.
function createBuildEnv({ env = process.env } = {}) {
  const buildEnv = {
    ...env,
    LOWDEFY_GIT_SHA: 'bench',
    NODE_OPTIONS: [env.NODE_OPTIONS, `--import=${pinBuildInputsUrl}`].filter(Boolean).join(' '),
  };
  delete buildEnv.CI;
  return buildEnv;
}

export default createBuildEnv;
