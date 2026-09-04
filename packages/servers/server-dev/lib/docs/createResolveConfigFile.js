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

import readBuildArtifact from './readBuildArtifact.js';

// The config file a `~k` came from, relative to the config directory — the
// same path shape `git diff --relative` prints, so a changed file joins
// straight onto the config keys it defines. resolveConfigLocation appends
// ":line" (and ":column") when the key carries them; only the file is wanted
// here.
function createResolveConfigFile() {
  const keyMap = readBuildArtifact({ name: 'keyMap.json' }) ?? {};
  const refMap = readBuildArtifact({ name: 'refMap.json' }) ?? {};
  return function resolveConfigFile(configKey) {
    const location = resolveConfigLocation({ configKey, keyMap, refMap });
    if (type.isNone(location)) {
      return null;
    }
    return location.source.split(':')[0];
  };
}

export default createResolveConfigFile;
