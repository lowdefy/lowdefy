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

import anchorGroup from './anchorGroup.js';
import estimateRun from './estimateRun.js';
import formatDuration from './formatDuration.js';

function countBy({ mutants, read }) {
  const counts = new Map();
  mutants.forEach((mutant) => {
    const key = read(mutant);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
}

// What `lowdefy journeys harden --list` prints: the sampled mutants by
// operator and by page, how many journeys each runs on, and the estimate.
function formatMutantList({ mutants, baselines, workers, sampled, notExercised }) {
  const lines = [];
  lines.push('Mutants by operator:');
  countBy({ mutants, read: (mutant) => mutant.operator }).forEach(([operator, count]) =>
    lines.push(`  ${String(count).padStart(5)}  ${operator}`)
  );
  lines.push('Mutants by page:');
  countBy({ mutants, read: (mutant) => anchorGroup(mutant.anchor) }).forEach(([group, count]) =>
    lines.push(`  ${String(count).padStart(5)}  ${group}`)
  );
  const { pairs, durationMs } = estimateRun({ mutants, baselines, workers });
  const mean = mutants.length === 0 ? 0 : pairs / mutants.length;
  lines.push(
    `${mutants.length} mutants · sampled ${mutants.length} of ${sampled.of} (seed ${
      sampled.seed
    }) · ${notExercised} not exercised · ${mean.toFixed(
      1
    )} journeys per mutant · ${pairs} runs · about ${formatDuration(
      durationMs
    )} on ${workers} workers`
  );
  return lines;
}

export default formatMutantList;
