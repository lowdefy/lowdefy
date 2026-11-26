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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest';

import { openTestApp } from '@lowdefy/test-utils';

import createBuildHost from '../../src/createBuildHost.js';
import openHeadlessPage from '../../src/openHeadlessPage.js';
import runHeadlessJourney from '../../src/runHeadlessJourney.js';
import journeyFixture from './journeyFixture.mjs';

// The bootstrap proof: a production build of apps/journey-fixture runs on the client engine in
// Node, with the build's own client plugins and no DOM or React, and a click sends the page's
// real Request, which runs in process on the data set's database.

let app;
let host;

beforeAll(async () => {
  app = await openTestApp(journeyFixture);
  host = await createBuildHost({ app, data: 'harden', user: 'member' });
});

beforeEach(() => {
  host.errorSink.errors.splice(0);
});

afterAll(async () => {
  await host?.close();
  await app?.close();
});

// The rules of the shell's isContextSettled: the init events are done, no block event is running
// and no request is loading.
function isSettled({ context, lowdefy }) {
  if (context._internal.onInitAsyncDone !== true) return false;
  if (lowdefy.appContext._internal.onInitAsyncDone !== true) return false;
  const running = Object.values(context._internal.RootSlots.map).some((block) =>
    Object.values(block.Events.events).some((event) => event.loading === true)
  );
  if (running) return false;
  return !Object.values(context.requests).some((calls) => calls?.[0]?.loading);
}

async function waitForSettled(page) {
  const started = Date.now();
  while (!isSettled(page)) {
    if (Date.now() - started > 10000) {
      throw new Error('The page did not settle within 10 s.');
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

test('a built page opens in Node with its onMount run, and a click sends its Request in process', async () => {
  const page = await openHeadlessPage({ host, pageId: 'home' });
  const { context } = page;
  await waitForSettled(page);

  // The page's own onMount ran on the engine.
  expect(context.state.rows).toEqual([{ label: 'First row' }, { label: 'Second row' }]);
  expect(context._internal.RootSlots.map.save_success.eval.visible).toBe(false);
  expect(context._internal.RootSlots.map.hidden_text.eval.visible).toBe(false);

  context._internal.RootSlots.map.name_input.setValue('Headless item');
  expect(context.state.name_input).toBe('Headless item');
  await context._internal.RootSlots.map.save_button.triggerEvent({ name: 'onClick' });
  await waitForSettled(page);

  // The payload is what the page's config built, and the answer is the server's.
  expect(page.calls).toHaveLength(1);
  const [save] = page.calls;
  expect(save).toMatchObject({
    kind: 'request',
    pageId: 'home',
    requestId: 'save_item',
    blockId: 'save_button',
    actionId: 'save',
    payload: { name: 'Headless item' },
    status: 200,
    success: true,
    error: null,
  });
  expect(save.response.acknowledged).toBe(true);
  expect(context.state.saved).toBe(true);
  expect(context.requests.save_item[0].response).toEqual(save.response);
  expect(context._internal.RootSlots.map.save_success.eval.visible).toBe(true);

  // The write landed on the data set's database, beside its fixture.
  const items = await host.findDocuments({ collection: 'items', match: { kind: 'item' } });
  expect(items.map((item) => item.name).sort()).toEqual(['Harden item', 'Headless item']);
  expect(host.errorSink.errors).toEqual([]);
});

test('a CallAPI runs its endpoint in process, and its detached CallApi is recorded after it', async () => {
  const page = await openHeadlessPage({ host, pageId: 'home' });
  await waitForSettled(page);
  await page.context._internal.RootSlots.map.notify_button.triggerEvent({ name: 'onClick' });
  await waitForSettled(page);
  // notify's detached CallApi is taken by the build host, which has no CRON_SECRET: recorded as
  // a call to its target, which never runs, and the endpoint answers as on a server.
  expect(page.calls).toEqual([
    expect.objectContaining({
      kind: 'endpoint',
      endpointId: 'notify',
      pageId: 'home',
      blockId: 'notify_button',
      status: 200,
      success: true,
      response: { notified: true },
    }),
    {
      kind: 'endpoint',
      endpointId: 'detached_log',
      detached: true,
      payload: {},
      status: null,
      success: null,
      response: null,
      error: null,
    },
  ]);
  expect(host.errorSink.errors).toEqual([]);
  expect(page.context.state.notified).toBe(true);
});

// One app serves a run's journeys: each host is a fresh session of its data set on it, and a
// host's close() ends only that session.
test('hosts on one app each get a fresh session, and closing one leaves the app serving the next', async () => {
  const saveJourney = {
    pageId: 'home',
    steps: [
      { fill: { blockId: 'name_input', value: 'Saved on the first host' } },
      { click: 'save_button' },
      { wait: { request: 'save_item' } },
      { expect: { state: { path: 'saved', equals: true } } },
    ],
  };
  const savedItem = {
    collection: 'items',
    connectionId: 'fixture_db',
    match: { name: 'Saved on the first host' },
  };
  const first = await createBuildHost({ app, data: 'harden', user: 'member' });
  try {
    const result = await runHeadlessJourney({ host: first, journey: saveJourney });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
    expect(await first.findDocuments(savedItem)).toHaveLength(1);
  } finally {
    await first.close();
  }
  await expect(async () => first.findDocuments(savedItem)).rejects.toThrow(/session is closed/);
  const second = await createBuildHost({ app, data: 'harden', user: 'member' });
  try {
    expect(await second.findDocuments(savedItem)).toEqual([]);
  } finally {
    await second.close();
  }
});

test('an unknown data set or user refuses that host alone, and the app serves the next', async () => {
  await expect(createBuildHost({ app, data: 'no-such-data-set', user: 'member' })).rejects.toThrow(
    /no-such-data-set/
  );
  await expect(createBuildHost({ app, data: 'harden', user: 'no_such_user' })).rejects.toThrow(
    /no_such_user/
  );
  const next = await createBuildHost({ app, data: 'harden', user: 'member' });
  try {
    expect(next.dataSetName).toBe('harden');
  } finally {
    await next.close();
  }
});

test('a missing build is refused with the message openTestApp gives', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journey-headless-'));
  try {
    await expect(
      openTestApp({
        configDirectory: journeyFixture.configDirectory,
        serverDirectory: path.join(directory, 'server'),
      })
    ).rejects.toThrow(/^No Lowdefy build found at ".*". Run "lowdefy build/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('a build older than its config is refused with the message openTestApp gives', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journey-headless-'));
  const configDirectory = path.join(directory, 'config');
  const serverDirectory = path.join(directory, 'server');
  try {
    fs.cpSync(journeyFixture.configDirectory, configDirectory, {
      recursive: true,
      preserveTimestamps: true,
      filter: (source) =>
        !source.split(path.sep).some((part) => part === '.lowdefy' || part === 'node_modules'),
    });
    fs.mkdirSync(serverDirectory);
    fs.cpSync(
      path.join(journeyFixture.serverDirectory, 'build'),
      path.join(serverDirectory, 'build'),
      { recursive: true, preserveTimestamps: true }
    );
    fs.symlinkSync(
      path.join(journeyFixture.serverDirectory, 'node_modules'),
      path.join(serverDirectory, 'node_modules'),
      'dir'
    );
    const later = new Date(Date.now() + 60000);
    fs.utimesSync(path.join(configDirectory, 'pages', 'home.yaml'), later, later);
    await expect(openTestApp({ configDirectory, serverDirectory })).rejects.toThrow(
      /is older than config file "pages\/home.yaml"/
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
