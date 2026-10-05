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

import { type } from '@lowdefy/helpers';

// The run's findings, one per key across walks, roles and charters, in the
// order the walks hit them: each with the walks and data set users that hit
// it, the goals of the charters whose walks hit it (charters lists the run's
// charters, which walk logs name by index; empty without any), and its first
// occurrence's step and screenshot. Whether a finding is proven is the
// proof's to say (applyProof).
function collectFindings({ logs, charters = [] }) {
  const byKey = new Map();
  logs.forEach((log) => {
    log.findings.forEach((finding) => {
      if (!byKey.has(finding.key)) {
        const occurrence = log.steps.find((step) => step.index === finding.step);
        byKey.set(finding.key, {
          key: finding.key,
          kind: finding.kind,
          severity: finding.severity,
          message: finding.message,
          pageId: finding.pageId,
          source: finding.source ?? null,
          step: finding.step ?? null,
          screenshot: occurrence?.screenshot ?? null,
          walks: [],
          users: [],
          charters: [],
        });
      }
      const entry = byKey.get(finding.key);
      if (!entry.walks.includes(log.walk)) entry.walks.push(log.walk);
      const user = log.user ?? 'default';
      if (!entry.users.includes(user)) entry.users.push(user);
      if (type.isNone(log.charter)) return;
      const { goal } = charters[log.charter];
      if (!entry.charters.includes(goal)) entry.charters.push(goal);
    });
  });
  return [...byKey.values()];
}

export default collectFindings;
