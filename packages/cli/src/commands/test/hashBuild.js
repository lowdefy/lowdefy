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
import crypto from 'crypto';
import { stableStringify } from '@lowdefy/helpers';

import normaliseArtifact from '../journeys/scope/normaliseArtifact.js';
import readBuildArtifacts from '../journeys/scope/readBuildArtifacts.js';
import resolveBuildDirectory from '../journeys/resolveBuildDirectory.js';

// Identifies the config a dev server serves by its content: the pages,
// requests, endpoints, connections, websockets and app-wide artifacts of the
// build, without the markers that only locate config (so moving config between
// files changes nothing) and without the buildId, which is a fresh timestamp
// on every server start. Two servers started on the same config report the
// same hash. Null when the build cannot be read, which no record ever matches.
function hashBuild({ context }) {
  try {
    const buildDirectory = resolveBuildDirectory({ context });
    if (!buildDirectory) {
      return null;
    }
    const build = readBuildArtifacts({ buildDirectory });
    const config = {};
    ['pages', 'requests', 'endpoints', 'connections', 'websockets', 'appWide'].forEach((group) => {
      config[group] = normaliseArtifact(build[group]);
    });
    return crypto.createHash('sha1').update(stableStringify(config)).digest('hex');
  } catch {
    return null;
  }
}

export default hashBuild;
