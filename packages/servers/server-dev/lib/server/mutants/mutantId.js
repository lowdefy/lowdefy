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

import crypto from 'node:crypto';

// A mutant's id, the same in every build of unchanged config: the ~k a mutant
// is applied by changes with every build, so sampling, reruns and reports use
// this instead. configPath is position-free (positionFreePath).
function mutantId({ artifact, configPath, operator, arg }) {
  return crypto
    .createHash('sha1')
    .update(JSON.stringify([artifact, configPath, operator, arg ?? null]))
    .digest('hex')
    .slice(0, 12);
}

export default mutantId;
