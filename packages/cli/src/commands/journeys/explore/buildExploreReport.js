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

import summariseTimings from './summariseTimings.js';

function countBy(values) {
  const counts = {};
  values.forEach((value) => {
    counts[value] = (counts[value] ?? 0) + 1;
  });
  return counts;
}

// Groups the not-proven findings by reason, in the order applyProof gives.
function groupByReason(findings) {
  const groups = {};
  findings
    .filter((finding) => finding.status === 'not-proven')
    .forEach((finding) => {
      groups[finding.reason] = [...(groups[finding.reason] ?? []), finding];
    });
  return groups;
}

// Each charter of the run with the pages and data set users its targets
// cover and how many walks it had. Walk logs and targets name a charter by
// its index.
function describeCharters({ charters, targets, logs }) {
  return charters.map((charter, index) => {
    const own = targets.filter((target) => target.charter === index);
    return {
      goal: charter.goal,
      pages: [...new Set(own.map((target) => target.pageId))],
      roles: [...new Set(own.map((target) => target.user ?? 'default'))],
      walks: logs.filter((log) => log.charter === index).length,
    };
  });
}

// report.json: what the run compared, the --charter that steered it (null
// without one), every charter it walked for (a --charter run's one, or a
// --charters file's, each with its pages, roles and walks), what it walked
// and what that cost, the targets it did not walk and why, its findings
// (proven ones first, then the not-proven ones grouped by reason, each naming
// the charters that hit it), how long the proofs took, the candidates it
// kept, the old candidate folders its start pruned (and those kept because a
// file in them was edited), and its trace file. findings comes from
// applyProof, in report order.
// readExploreRuns reads run, pr, base, head and finishedAt from it.
function buildExploreReport({
  run,
  revisions,
  charter = null,
  charters = [],
  scope,
  walked,
  findings,
  proof,
  candidates,
  pruned = { pruned: [], keptEdited: [] },
  trace,
  startedAt,
  finishedAt,
  budgetMs,
}) {
  const { logs, costs, policy } = walked;
  const steps = logs.reduce((total, log) => total + log.steps.length, 0);
  const asked = costs.calls;
  return {
    run,
    pr: revisions.pr,
    base: revisions.base,
    head: revisions.head,
    dirty: revisions.dirty,
    charter,
    charters: describeCharters({ charters, targets: walked.targets, logs }),
    startedAt,
    finishedAt,
    policy: {
      name: policy.name,
      backend: policy.backend ?? null,
      modelId: policy.modelId ?? null,
      fallbackModelId: policy.fallbackModelId ?? null,
      switched: policy.switched?.() ?? null,
    },
    data: walked.dataName,
    scope: {
      pages: scope.pages.map((page) => page.pageId),
      appWide: scope.appWide,
      uncompared: scope.uncompared,
      removedPages: scope.removedPages,
    },
    budget: { budgetMs, walkMs: walked.walkMs, stopped: walked.stopped },
    ran: {
      pages: new Set(logs.map((log) => log.pageId)).size,
      targets: new Set(logs.map((log) => `${log.pageId}\u0000${log.user ?? ''}`)).size,
      walks: logs.length,
      steps,
    },
    stopReasons: countBy(logs.map((log) => log.stopReason)),
    timings: summariseTimings({ logs }),
    model: {
      ...costs,
      usdPerQuestion: asked === 0 ? null : costs.usd / asked,
      estimated: costs.estimatedUsd > 0,
    },
    notRun: walked.notRun,
    accessChanged: logs
      .filter((log) => log.stopReason === 'access-changed')
      .map((log) => ({ pageId: log.pageId, user: log.user })),
    findings: {
      proven: findings.filter((finding) => finding.status === 'proven'),
      notProven: groupByReason(findings),
    },
    proof,
    candidates,
    pruned,
    trace,
  };
}

export default buildExploreReport;
