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

import crypto from 'node:crypto';
import path from 'node:path';
import { type } from '@lowdefy/helpers';

import acquireBrowserSlot from '../acquireBrowserSlot.js';
import armIdleClose from './armIdleClose.js';
import checkWalkWriteRules from './checkWalkWriteRules.js';
import closeWalkSession from './closeWalkSession.js';
import getDataStore from '../dataSets/getDataStore.js';
import { getBrowser } from '../getBrowser.js';
import noBrowserError from '../noBrowserError.js';
import observeWalkPage from './observeWalkPage.js';
import openDataSession from '../dataSets/openDataSession.js';
import openJourney from '../openJourney.js';
import readDevAuthMode from '../readDevAuthMode.js';
import resolveJourneyDataSet from '../dataSets/resolveJourneyDataSet.js';
import validateOpenWalkBody from './validateOpenWalkBody.js';
import watchWalkContext from './watchWalkContext.js';
import { listWalks, registerWalk } from './walkSessions.js';

const MAX_OPEN_WALKS = 2;
const WALK_WIDTH = 1280;
const WALK_HEIGHT = 800;
const WALK_OPEN_TIMEOUT_MS = 15000;
const WALK_STEP_TIMEOUT_MS = 5000;

// A data set user name, or a headless user object; the default headless
// user when the explorer names none.
function walkUser(user) {
  return type.isNone(user) ? undefined : user;
}

// POST /lowdefy-docs/explore/walks: opens an explorer walk, a journey's
// actors on a fresh data session, recorded as source explorer under the
// run's id with the walk's name as run.journey (record: false records
// nothing, but its errors still reach the walk). The walk is registered
// before its page opens, so errors the first page load causes reach it. It
// holds a browser slot until it closes. Returns { status, body }: 200 with
// { walkId, observation }, 400 for a bad body or a refused data rule, 409
// when two walks are open (or this run's walk already is), 502 when no
// browser can launch.
async function openWalk({ body, origin, basePath = '', idleMs }) {
  const bodyError = validateOpenWalkBody(body);
  if (!type.isUndefined(bodyError)) {
    return { status: 400, body: { error: bodyError } };
  }
  const { pageId, urlQuery, user, data, liveData, run, walk: walkName, record } = body;
  const allowExternal = body.allowExternal ?? [];
  const open = listWalks();
  if (open.some((walk) => walk.run === run && walk.journey === walkName)) {
    return {
      status: 409,
      body: { error: `Walk "${walkName}" of run ${run} is already open.` },
    };
  }
  if (open.length >= MAX_OPEN_WALKS) {
    return {
      status: 409,
      body: {
        error: `${MAX_OPEN_WALKS} walks are already open on this dev server. Close one first.`,
      },
    };
  }
  const buildDirectory = path.join(process.cwd(), 'build');
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd();
  const ruleError = await checkWalkWriteRules({ buildDirectory, data, liveData, allowExternal });
  if (!type.isUndefined(ruleError)) {
    return { status: 400, body: { error: ruleError } };
  }
  const resolved = await resolveJourneyDataSet({
    data,
    user: walkUser(user),
    configDirectory,
    buildDirectory,
    ...readDevAuthMode(),
  });
  if (!type.isUndefined(resolved.error)) {
    return { status: 400, body: { error: resolved.error } };
  }
  const dataSet = resolved.dataSet ?? null;

  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return { status: 502, body: { error: noBrowserError(error) } };
  }
  let slot;
  try {
    slot = await acquireBrowserSlot();
  } catch (error) {
    return { status: 503, body: { error: error.message } };
  }

  const walk = registerWalk({
    walkId: crypto.randomUUID(),
    run,
    journey: walkName,
    pageId,
    record,
    allowExternal,
    dataSet,
    snapshot: !type.isNone(dataSet?.snapshot),
    buildDirectory,
    origin,
    basePath,
    slot,
    session: null,
    runner: null,
    events: { pageErrors: [], requests: [], responses: [] },
    typed: [],
    visitedPages: new Set(),
    exclusions: new Map(),
    observation: null,
    busy: false,
    idleTimer: null,
    closing: null,
    openedAt: Date.now(),
  });
  try {
    if (dataSet !== null) {
      await getDataStore();
      walk.session = await openDataSession({ dataSet });
    }
    const recording = {
      source: 'explorer',
      run: { id: run, by: 'explorer', journey: walkName },
    };
    if (!record) recording.record = false;
    const { journey } = await openJourney({
      browser,
      origin,
      basePath,
      pageId,
      user: resolved.user,
      urlQuery,
      width: WALK_WIDTH,
      height: WALK_HEIGHT,
      timeout: WALK_OPEN_TIMEOUT_MS,
      stepTimeout: WALK_STEP_TIMEOUT_MS,
      dataCookie: walk.session?.cookie,
      users: dataSet?.users,
      recording,
      onContext: ({ context }) =>
        watchWalkContext({ context, events: walk.events, origin, basePath }),
    });
    walk.runner = journey;
    walk.observation = await observeWalkPage({ walk, open: true });
  } catch (error) {
    await closeWalkSession(walk).catch(() => {});
    return {
      status: 502,
      body: { error: `Could not open a walk on page "${pageId}": ${error.message}` },
    };
  }
  armIdleClose({ walk, idleMs });
  return { status: 200, body: { walkId: walk.walkId, observation: walk.observation } };
}

export default openWalk;
