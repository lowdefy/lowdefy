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

function hashIndex({ parts, length }) {
  const digest = crypto.createHash('sha1').update(JSON.stringify(parts)).digest('hex');
  return parseInt(digest.slice(0, 8), 16) % length;
}

// The policy that needs no model: deterministic walks for a seed. Among the
// offered candidates, untried ones in a changed or added block come first,
// then other untried ones, then tried ones; within the first group that has
// any, one is picked by a hash of (seed, page id, role, walk index, step
// index), never the run id, so the same seed, scope, app and data set walk
// the same way every run. A fill or select candidate's value rotates with the
// walk index. It scores no relevance.
function createSeededPolicy({ seed = 0 } = {}) {
  function choose({ optionToStep, pageId, role, walkIndex, stepIndex }) {
    const groups = new Map();
    Object.entries(optionToStep).forEach(([optionId, entry]) => {
      const key = JSON.stringify([entry.candidate.kind, entry.candidate.target]);
      if (!groups.has(key)) groups.set(key, { entry, optionIds: [] });
      groups.get(key).optionIds.push(optionId);
    });
    const candidates = [...groups.values()];
    if (candidates.length === 0) return null;
    const classes = [
      candidates.filter(({ entry }) => !entry.tried && entry.changed),
      candidates.filter(({ entry }) => !entry.tried && !entry.changed),
      candidates.filter(({ entry }) => entry.tried),
    ];
    const pool = classes.find((group) => group.length > 0);
    const picked =
      pool[hashIndex({ parts: [seed, pageId, role, walkIndex, stepIndex], length: pool.length })];
    return picked.optionIds[walkIndex % picked.optionIds.length];
  }

  return { name: 'seeded', choose };
}

export default createSeededPolicy;
