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

/*
  One build/monitors.json entry → one Axiom monitor object (POST/PUT /v2/monitors).
  This file and renderApl.mjs are the whole vendor surface: to push the same
  artifact to Grafana or Datadog, write renderGrafanaMonitor.mjs beside them.
*/

import renderApl from './renderApl.mjs';

const OPERATORS = { above: 'Above', below: 'Below' };

function formatRange(minutes) {
  if (minutes % 1440 === 0) return `${minutes / 1440}d`;
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${minutes}m`;
}

// How often Axiom re-runs the query. Half the window keeps a breach visible for
// two checks; a monitor is never checked more than once a minute or less than
// once a day, whatever the window.
function checkInterval(minutes) {
  return Math.min(Math.max(Math.round(minutes / 2), 1), 1440);
}

function threshold(rule) {
  if (rule.type === 'latency_p95') return rule.threshold_ms;
  return rule.threshold;
}

// `lowdefy:<app>:<id>` is the idempotency key: the push finds an existing
// monitor by this name and updates it, so re-running a deploy never duplicates.
function monitorName({ app, monitor }) {
  return `lowdefy:${app}:${monitor.id}`;
}

function renderAxiomMonitor({ monitor, app, dataset, notifierIds = [] }) {
  if (monitor.status !== 'active') {
    throw new Error(`Monitor "${monitor.id}" has status "${monitor.status}" and cannot be pushed.`);
  }
  const description = [monitor.description, monitor.source ? `Config: ${monitor.source}` : null]
    .filter(Boolean)
    .join(' ');
  return {
    name: monitorName({ app, monitor }),
    description,
    aplQuery: renderApl({ rule: monitor.rule, dataset }),
    type: 'Threshold',
    operator: OPERATORS[monitor.rule.comparison],
    threshold: threshold(monitor.rule),
    range: formatRange(monitor.rule.window_minutes),
    intervalMinutes: checkInterval(monitor.rule.window_minutes),
    // A freshness monitor is exactly the "no rows came back" case, so it has to
    // alert on no data; the rate and latency monitors would only cry wolf on a
    // quiet window.
    alertOnNoData: monitor.rule.type === 'freshness',
    notifierIds,
    disabled: false,
  };
}

export { monitorName };
export default renderAxiomMonitor;
