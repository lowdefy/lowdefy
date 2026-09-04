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

import { resolveConfigLocation } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import readBuildArtifact from '../readBuildArtifact.js';

// A production line carries `config_key`, never a file path: `source` is a
// function of (config_key, git_sha), and only this working tree's build knows
// the mapping for its own sha. Resolved here, once per tool call, against the
// build the dev server is serving — a row from another deploy keeps its
// config_key and says why.
function createResolveEventSource() {
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
  const keyMap = readBuildArtifact({ name: 'keyMap.json' }) ?? {};
  const refMap = readBuildArtifact({ name: 'refMap.json' }) ?? {};
  const buildGitSha =
    readBuildArtifact({ name: 'appMeta.json', deserialize: true })?.gitSha ?? null;

  return function resolveEventSource({ configKey, gitSha }) {
    if (type.isNone(configKey)) {
      return { source: null, config_key: null };
    }
    if (type.isNone(gitSha) || gitSha !== buildGitSha) {
      return {
        source: null,
        config_key: configKey,
        note: `Row is from git_sha ${gitSha ?? 'unknown'}, the running build is ${
          buildGitSha ?? 'unknown'
        }; check out that revision to resolve config_key to a file.`,
      };
    }
    const location = resolveConfigLocation({ configKey, keyMap, refMap, configDirectory });
    if (type.isNone(location)) {
      return {
        source: null,
        config_key: configKey,
        note: 'config_key is not in this build keyMap, although the git_sha matches.',
      };
    }
    return { source: location.source, config: location.config, config_key: configKey };
  };
}

export default createResolveEventSource;
