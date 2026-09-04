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

import renderAxiomMonitor, { monitorName } from './renderAxiomMonitor.mjs';
import resolveNotifierIds from './resolveNotifierIds.mjs';

const API_URL = 'https://api.axiom.co/v2/monitors';
const NOTIFIERS_URL = 'https://api.axiom.co/v2/notifiers';

async function request({ fetchImpl, url, method, token, orgId, body }) {
  const response = await fetchImpl(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(orgId ? { 'X-Axiom-Org-ID': orgId } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Axiom ${method} ${url} failed with ${response.status}: ${text}`);
  }
  return response.json();
}

/*
  Idempotent by monitor name: every monitor this app owns is named
  `lowdefy:<app>:<id>`, so a second run updates the same monitors instead of
  creating a second set. An existing monitor's notifierIds are kept — routing is
  the operator's, not the build's — but they are verified against the notifiers
  Axiom actually has, and every monitor is resolved before the first write, so a
  routing mistake fails the whole push instead of leaving half the monitors
  updated and the rest silent.
*/
async function syncMonitors({
  monitors,
  app,
  dataset,
  token,
  orgId,
  notifiers = [],
  allowSilent = false,
  fetchImpl = fetch,
  dryRun = false,
  log = console.log,
}) {
  const active = monitors.filter((monitor) => monitor.status === 'active');
  const skipped = monitors.filter((monitor) => monitor.status !== 'active');
  skipped.forEach((monitor) => {
    log(`skip ${monitor.id} (${monitor.status}): ${monitor.note ?? 'no rule'}`);
  });

  const existing = dryRun
    ? []
    : await request({ fetchImpl, url: API_URL, method: 'GET', token, orgId });
  const existingByName = new Map((existing ?? []).map((monitor) => [monitor.name, monitor]));
  const available = dryRun
    ? []
    : await request({ fetchImpl, url: NOTIFIERS_URL, method: 'GET', token, orgId });

  if (dryRun && active.length > 0) {
    log(
      'dry-run: no call is made, so notifier routing is not resolved — every payload below prints with an empty notifierIds.'
    );
  }
  const planned = active.map((monitor) => {
    const name = monitorName({ app, monitor });
    const current = existingByName.get(name);
    const notifierIds = dryRun
      ? []
      : resolveNotifierIds({
          monitorName: name,
          requested: notifiers,
          existingNotifierIds: current?.notifierIds ?? [],
          available: available ?? [],
          allowSilent,
        });
    return {
      name,
      current,
      payload: renderAxiomMonitor({ monitor, app, dataset, notifierIds }),
    };
  });

  const results = [];
  for (const { name, current, payload } of planned) {
    if (dryRun) {
      log(JSON.stringify(payload, null, 2));
      results.push({ action: 'dry-run', name, payload });
      continue;
    }
    if (current) {
      await request({
        fetchImpl,
        url: `${API_URL}/${current.id}`,
        method: 'PUT',
        token,
        orgId,
        body: payload,
      });
      log(`updated ${name}`);
      results.push({ action: 'updated', name, id: current.id, payload });
      continue;
    }
    const created = await request({
      fetchImpl,
      url: API_URL,
      method: 'POST',
      token,
      orgId,
      body: payload,
    });
    log(`created ${name}`);
    results.push({ action: 'created', name, id: created?.id, payload });
  }
  return { results, skipped: skipped.map((monitor) => monitor.id) };
}

export { API_URL, NOTIFIERS_URL };
export default syncMonitors;
