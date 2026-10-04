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

const STATUS_BY_SEVERITY = { warning: 'warning', info: 'environment' };

// The run's findings, one per key across walks and roles: each with the walks
// and data set users that hit it, its first occurrence's step and screenshot,
// and its status: confirmed or unconfirmed for an error (from the
// confirmation replays, by key), warning for a dead click, environment for an
// error the data set's store cannot avoid.
function collectFindings({ logs, confirmations }) {
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
          status: STATUS_BY_SEVERITY[finding.severity] ?? 'unconfirmed',
        });
      }
      const entry = byKey.get(finding.key);
      if (!entry.walks.includes(log.walk)) entry.walks.push(log.walk);
      const user = log.user ?? 'default';
      if (!entry.users.includes(user)) entry.users.push(user);
    });
  });
  confirmations.forEach(({ key, status }) => {
    const entry = byKey.get(key);
    if (entry !== undefined && entry.severity === 'error' && status === 'confirmed') {
      entry.status = 'confirmed';
    }
  });
  return [...byKey.values()];
}

export default collectFindings;
