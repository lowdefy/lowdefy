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

import { readRecordings } from '@lowdefy/node-utils';

import { fixtureTest, fixtureUrl, postJson } from './fixtureClient.mjs';

// The explorer's walk session routes over the fixture app, in a real
// Chromium: a walk opens on a fresh data session, runs only offered steps,
// records as source explorer under its run and walk, and closes.

const configDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY;

let runCount = 0;
function newRunId() {
  runCount += 1;
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
  return `${stamp}-wk${String(runCount).padStart(4, '0')}`;
}

function openWalk(body) {
  return postJson({ path: '/lowdefy-docs/explore/walks', body });
}

function stepWalk({ walkId, step }) {
  return postJson({ path: `/lowdefy-docs/explore/walks/${walkId}/steps`, body: { step } });
}

async function closeWalk({ walkId }) {
  const response = await fetch(`${fixtureUrl}/lowdefy-docs/explore/walks/${walkId}`, {
    method: 'DELETE',
  });
  return { status: response.status, body: await response.json() };
}

function findCandidate({ observation, kind, blockId }) {
  const candidate = observation.candidates.find(
    (entry) => entry.kind === kind && entry.target.blockId === blockId
  );
  if (candidate === undefined) {
    throw new Error(
      `No ${kind} candidate on ${blockId} in ${JSON.stringify(observation.candidates)}`
    );
  }
  return candidate;
}

fixtureTest(
  'the open route refuses a walk without a data set on an app with a MongoDBCollection connection',
  async () => {
    const { status, body } = await openWalk({
      pageId: 'home',
      run: newRunId(),
      walk: 'walk-1',
      record: false,
      liveData: true,
    });
    expect(status).toBe(400);
    expect(body.error).toMatch(/cli\.agentTools\.allowWriteRequests: true/);
  }
);

fixtureTest(
  'a recorded walk opens on a data set, runs offered steps, refuses an unoffered one, and records as explorer under its walk',
  async () => {
    const run = newRunId();
    const opened = await openWalk({
      pageId: 'home',
      user: 'member',
      data: 'explore',
      run,
      walk: 'walk-1',
      record: true,
    });
    expect(opened.status).toBe(200);
    const { walkId, observation } = opened.body;
    expect(observation.pageId).toBe('home');
    expect(observation.redirected).toBe(false);
    expect(observation.ready).toBe(true);
    const fill = findCandidate({ observation, kind: 'fill', blockId: 'name_input' });
    expect(fill.input).toEqual(expect.objectContaining({ valueType: 'string', required: true }));
    expect(observation.candidates.some((entry) => entry.target.blockId === 'hidden_text')).toBe(
      false
    );

    const filled = await stepWalk({
      walkId,
      step: { fill: { ...fill.target, value: 'Explorer name 0' } },
    });
    expect(filled.status).toBe(200);
    expect(filled.body.result.status).toBe('ok');

    const save = findCandidate({
      observation: filled.body.observation,
      kind: 'click',
      blockId: 'save_button',
    });
    const saved = await stepWalk({ walkId, step: { click: save.target } });
    expect(saved.status).toBe(200);
    expect(saved.body.result.status).toBe('ok');
    expect(saved.body.findings).toEqual([]);

    // A control the walk never offered, sent as curl would send it.
    const refused = await stepWalk({ walkId, step: { click: { blockId: 'hidden_text' } } });
    expect(refused.status).toBe(400);

    expect(await closeWalk({ walkId })).toEqual({ status: 200, body: { closed: true } });
    const afterClose = await stepWalk({ walkId, step: { click: save.target } });
    expect(afterClose.status).toBe(404);

    const records = readRecordings({ configDirectory, source: 'explorer', run });
    expect(records.length).toBeGreaterThan(0);
    records.forEach((record) => {
      expect(record.source).toBe('explorer');
      expect(record.run).toEqual(
        expect.objectContaining({ id: run, by: 'explorer', journey: 'walk-1', actor: 'main' })
      );
    });
  }
);

fixtureTest('a walk with record false leaves no recording', async () => {
  const run = newRunId();
  const opened = await openWalk({
    pageId: 'home',
    user: 'member',
    data: 'explore',
    run,
    walk: 'walk-1-confirm',
    record: false,
  });
  expect(opened.status).toBe(200);
  const { walkId, observation } = opened.body;
  const count = findCandidate({ observation, kind: 'click', blockId: 'count_button' });
  expect((await stepWalk({ walkId, step: { click: count.target } })).status).toBe(200);
  expect((await closeWalk({ walkId })).status).toBe(200);
  expect(readRecordings({ configDirectory, source: 'explorer', run })).toEqual([]);
});
