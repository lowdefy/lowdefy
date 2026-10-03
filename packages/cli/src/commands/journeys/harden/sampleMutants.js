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

function sampleKey({ seed, id }) {
  return crypto.createHash('sha1').update(`${seed}:${id}`).digest('hex');
}

// Keeps at most `max` mutants (0: no cap), ordered by sha1 of seed and id: the
// same sample on every machine for the same config, journeys and seed, spread
// across operators and pages, and a different one for another seed.
function sampleMutants({ mutants, max, seed }) {
  if (max === 0 || mutants.length <= max) {
    return mutants;
  }
  return mutants
    .map((mutant) => ({ mutant, key: sampleKey({ seed, id: mutant.id }) }))
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(0, max)
    .map(({ mutant }) => mutant);
}

export default sampleMutants;
