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

import { serializer } from '@lowdefy/helpers';

import applyMutant from './applyMutant.js';

// Wraps a request's readConfigFile so the one artifact a mutant run targets is
// served mutated: the original read (which the cache may share with every
// other request) is copied, the mutant applied to the copy, and each
// application counted on the run. Every other path passes straight through.
function createMutantReadConfigFile({ readConfigFile, run }) {
  return async function mutantReadConfigFile(filePath) {
    const original = await readConfigFile(filePath);
    if (filePath !== run.mutant.artifact) {
      return original;
    }
    const copy = serializer.copy(original);
    const outcome = applyMutant({ root: copy, mutant: run.mutant });
    if (outcome.applied) {
      run.applied += 1;
    } else {
      run.misses.push({ reason: outcome.reason, path: filePath });
    }
    return copy;
  };
}

export default createMutantReadConfigFile;
