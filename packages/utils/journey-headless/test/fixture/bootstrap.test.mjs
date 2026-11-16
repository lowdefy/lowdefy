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

import createBuildHost from '../../src/createBuildHost.js';
import openHeadlessPage from '../../src/openHeadlessPage.js';
import journeyFixture from './journeyFixture.mjs';

// The bootstrap proof: a production build of apps/journey-fixture runs on the client engine in
// Node, with the build's own client plugins and no DOM or React, and a click sends the page's
// real Request, which runs in process on the data set's database.

let host;

beforeAll(async () => {
  host = await createBuildHost({ ...journeyFixture, data: 'harden', user: 'member' });
});

beforeEach(() => {
  host.errorSink.errors.splice(0);
});

afterAll(async () => {
  await host?.close();
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
  const items = await host.dataSession
    .collection('fixture_db')
    .find({ kind: 'item' })
    .sort({ name: 1 })
    .toArray();
  expect(items.map((item) => item.name)).toEqual(['Harden item', 'Headless item']);
  expect(host.errorSink.errors).toEqual([]);
});

test("a CallAPI runs its endpoint in process, and the endpoint's fault reaches the error sink", async () => {
  const page = await openHeadlessPage({ host, pageId: 'home' });
  await waitForSettled(page);
  await page.context._internal.RootSlots.map.notify_button.triggerEvent({ name: 'onClick' });
  await waitForSettled(page);
  // notify's detached CallApi has no CRON_SECRET in a test, as in test-utils' sessions: the
  // endpoint answers with success false and the server logs the fault.
  expect(page.calls).toEqual([
    expect.objectContaining({
      kind: 'endpoint',
      endpointId: 'notify',
      pageId: 'home',
      blockId: 'notify_button',
      status: 200,
      success: false,
    }),
  ]);
  const serverFaults = host.errorSink.errors.filter((entry) => entry.source === 'server');
  expect(serverFaults.map((entry) => entry.error.message)).toEqual([
    'CallApi with "detached: true" requires the CRON_SECRET environment variable — the /api/detached route fails closed without it.',
  ]);
  // The failed CallAPI stopped the chain before set_notified, and the client reported it.
  expect(page.context.state.notified).toBeUndefined();
  expect(host.errorSink.errors.some((entry) => entry.source === 'client')).toBe(true);
});

test('a missing build is refused with the message openTestApp gives', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journey-headless-'));
  try {
    await expect(
      createBuildHost({
        configDirectory: journeyFixture.configDirectory,
        serverDirectory: path.join(directory, 'server'),
        user: 'member',
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
    await expect(
      createBuildHost({ configDirectory, serverDirectory, user: 'member' })
    ).rejects.toThrow(/is older than config file "pages\/home.yaml"/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
