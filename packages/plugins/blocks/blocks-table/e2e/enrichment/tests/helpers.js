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

import { expect } from '@playwright/test';

import { cronSecret, mockUrl } from '../settings.js';

// Calls an API endpoint of the app, as CallAPI does, and returns its response. A refused call
// (a :reject, a failed payload check) returns { error } instead, so a test can assert it.
async function callEndpoint(request, endpointId, payload = {}) {
  const res = await request.post(`/api/endpoints/${endpointId}`, { data: { payload } });
  const body = await res.json();
  if (body.success === true) return body.response;
  // The error is serialized (an Error travels as { '~e': { name, message } }).
  const error = body.error?.['~e'] ?? body.error ?? body;
  return { error: error.message ?? JSON.stringify(body) };
}

// A cron tick: runs the worker in this request and returns { rounds, cells }.
async function runCron(request) {
  const res = await request.get('/api/cron/enrichment_worker', {
    headers: { authorization: `Bearer ${cronSecret}`, 'x-vercel-cron-schedule': '* * * * *' },
  });
  const body = await res.json();
  expect(body.success, JSON.stringify(body)).toBe(true);
  return body.response;
}

const mock = {
  async reset(request) {
    await request.post(`${mockUrl}/__reset`);
  },
  async latency(request, latencyMs) {
    await request.post(`${mockUrl}/__config`, { data: { latencyMs } });
  },
  async log(request, service) {
    const res = await request.get(`${mockUrl}/__log`);
    const log = await res.json();
    return service === undefined ? log : log.filter((entry) => entry.service === service);
  },
};

// A fresh database (the seed leads, no user columns) and fresh mocks.
async function reset(request) {
  await mock.reset(request);
  const response = await callEndpoint(request, 'test_reset');
  expect(response.insertedCount).toBe(9);
}

async function readLeads(request) {
  return callEndpoint(request, 'test_leads');
}

function byName(leads, name) {
  const lead = leads.find((item) => item.name === name);
  if (lead === undefined) throw new Error(`No lead named ${name}.`);
  return lead;
}

function cellOf(lead, columnKey) {
  return lead._enrich?.[columnKey] ?? {};
}

async function rowKeys(request, names) {
  const leads = await readLeads(request);
  return names.map((name) => byName(leads, name)._id);
}

// Polls the leads until `check(leads)` passes (it throws, like expect, until then).
async function waitForLeads(request, check, { timeout = 15000 } = {}) {
  let leads;
  await expect(async () => {
    leads = await readLeads(request);
    check(leads);
  }).toPass({ timeout, intervals: [100, 200, 300] });
  return leads;
}

function isSettled(lead) {
  return Object.values(lead._enrich ?? {}).every(
    (cell) => cell.status !== 'queued' && cell.status !== 'running'
  );
}

// Runs cron ticks until no cell is queued or running: retries wait out their backoff, which
// the worker never sleeps through, so each tick claims the cells that are due by then. A
// detached worker completes a cell a moment before it queues the cells that read it, so the
// leads only count as settled when a further tick finds nothing and nothing changed.
async function settle(request, { timeout = 20000 } = {}) {
  let leads;
  await expect(async () => {
    await runCron(request);
    leads = await readLeads(request);
    expect(leads.filter((lead) => !isSettled(lead)).map((lead) => lead.name)).toEqual([]);
    const tick = await runCron(request);
    expect(tick.cells).toBe(0);
    expect(await readLeads(request)).toEqual(leads);
  }).toPass({ timeout, intervals: [250, 500, 750] });
  return leads;
}

function date(value) {
  return new Date(value['~d']);
}

export {
  byName,
  callEndpoint,
  cellOf,
  date,
  mock,
  readLeads,
  reset,
  rowKeys,
  runCron,
  settle,
  waitForLeads,
};
