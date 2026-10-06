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

import path from 'path';

// Proven findings first: app errors, then dead clicks, then role refusals.
function provenRank(finding) {
  if (finding.kind === 'dead-click') return 1;
  if (finding.kind === 'role-refused') return 2;
  return 0;
}

const REASON_ORDER = ['not-reproduced', 'environment', 'no-candidate', 'live-writes'];

// Gives each finding its status from the proof: proven, with the candidate
// journey that proves it (relative to the config directory), or not-proven
// with its reason. Returns the findings in report order: proven ones first
// (app errors, then dead clicks, then role refusals), then not-proven ones
// grouped by reason (not-reproduced, environment, no-candidate,
// live-writes), each group in the order the walks hit them.
function applyProof({ findings, proof, configDirectory }) {
  const provenPaths = new Map(proof.proven.map((entry) => [entry.key, entry.path]));
  const reasons = new Map(proof.notProven.map((entry) => [entry.key, entry.reason]));
  const proven = findings
    .filter((finding) => provenPaths.has(finding.key))
    .map((finding) => ({
      ...finding,
      status: 'proven',
      candidate: path.relative(configDirectory, provenPaths.get(finding.key)),
    }))
    .sort((a, b) => provenRank(a) - provenRank(b));
  const notProven = REASON_ORDER.flatMap((reason) =>
    findings
      .filter((finding) => reasons.get(finding.key) === reason)
      .map((finding) => ({ ...finding, status: 'not-proven', reason }))
  );
  return [...proven, ...notProven];
}

export default applyProof;
