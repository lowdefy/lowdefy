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

import evaluateInvariants from './evaluateInvariants.js';
import resolveConfigKeySource from './resolveConfigKeySource.js';
import usesSearchStage from './usesSearchStage.js';

// The fixed invariants over one window of a walk, read against the walk's
// build and config directory.
async function evaluateWalkWindow({ walk, step, result, window, pageId }) {
  const { buildDirectory, configDirectory } = walk;
  return evaluateInvariants({
    step,
    result,
    window,
    pageId,
    basePath: walk.basePath,
    configDirectory,
    usesSearchStage: (entry) => usesSearchStage({ buildDirectory, entry }),
    resolveSource: (configKey) =>
      resolveConfigKeySource({ buildDirectory, configDirectory, configKey }),
  });
}

export default evaluateWalkWindow;
