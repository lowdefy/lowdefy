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

import confirmFinding from './confirmFinding.js';

// Confirmation replays, run right after the walk that needed them, so they
// count against the budget. A walk that ended on an error finding is replayed
// for that finding, unless its key is already confirmed; a replay the budget
// or the spending cap no longer allows leaves the finding unconfirmed.
// list() gives { key, walk, replay, status, ms } per finding considered;
// findingsByWalk maps each walk with a confirmed error finding to that
// finding, which compileWalks puts in its candidates' origin.
function createConfirmations({ client, run, options, shouldStop }) {
  const confirmations = [];
  const confirmedKeys = new Set();
  const findingsByWalk = new Map();

  async function afterWalk({ log, target }) {
    const finding = log.findings.find((entry) => entry.severity === 'error');
    if (finding === undefined) return;
    if (confirmedKeys.has(finding.key)) {
      confirmations.push({
        key: finding.key,
        walk: log.walk,
        replay: null,
        status: 'confirmed',
        ms: 0,
      });
      findingsByWalk.set(log.walk, finding);
      return;
    }
    const stop = shouldStop();
    if (stop !== null) {
      confirmations.push({
        key: finding.key,
        walk: log.walk,
        replay: null,
        status: 'unconfirmed',
        ms: 0,
        skipped: stop,
      });
      return;
    }
    const result = await confirmFinding({ client, run, log, finding, target, options });
    confirmations.push({ key: finding.key, walk: log.walk, ...result });
    if (result.status === 'confirmed') {
      confirmedKeys.add(finding.key);
      findingsByWalk.set(log.walk, finding);
    }
  }

  return { afterWalk, list: () => [...confirmations], findingsByWalk };
}

export default createConfirmations;
