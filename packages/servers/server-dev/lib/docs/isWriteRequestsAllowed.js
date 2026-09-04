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
import { get, type } from '@lowdefy/helpers';
import { readFile } from '@lowdefy/node-utils';
import YAML from 'yaml';

// The top-level "cli" key in lowdefy.yaml never reaches a build artifact:
// the build's root schema (packages/build/src/lowdefySchema.js) accepts an
// arbitrary "cli" object, but no builder copies it onto `components`, so it
// is never written to build/config.json (which only ever holds
// components.config — see packages/build/src/build/writeConfig.js). The
// Lowdefy CLI itself reads "cli" straight from lowdefy.yaml rather than from
// a build artifact (packages/cli/src/utils/getLowdefyYaml.js) — this mirrors
// that precedent instead of inventing a new build artifact for one dev-only
// opt-in flag. Read fresh (no caching) so toggling the flag in lowdefy.yaml
// takes effect without a server restart.
async function isWriteRequestsAllowed() {
  // `lowdefy test` sets this on a server it started itself for the length of one
  // run, so an app with an endpoint request test does not have to commit
  // cli.agentTools.allowWriteRequests and leave the gate open for every ordinary
  // development session.
  if (process.env.LOWDEFY_TEST_RUN === '1') {
    return true;
  }
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
  let raw = await readFile(path.join(configDirectory, 'lowdefy.yaml'));
  if (type.isNone(raw)) {
    raw = await readFile(path.join(configDirectory, 'lowdefy.yml'));
  }
  if (type.isNone(raw)) {
    return false;
  }
  let lowdefy;
  try {
    lowdefy = YAML.parse(raw);
  } catch {
    return false;
  }
  return get(lowdefy, 'cli.agentTools.allowWriteRequests', { default: false }) === true;
}

export default isWriteRequestsAllowed;
