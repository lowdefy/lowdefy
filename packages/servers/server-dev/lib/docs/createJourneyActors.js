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

import collectVisibleBlockIds from '../client/collectVisibleBlockIds.js';
import createJourneyObservations from './createJourneyObservations.js';
import createNetworkCounter from './createNetworkCounter.js';
import { openPage } from './getBrowser.js';

// The binding client/JourneyObserver.jsx looks for. A binding exists in every
// document of the context it is exposed on, across full page loads, and in no
// developer tab, so only a journey's own pages report what they ran.
const OBSERVE_BINDING = '__lowdefyJourneyObserve';

let actorCount = 0;

// Every actor is its own client, as two people on two devices are: auth rate
// limits count attempts per client address, and a whole suite run from one
// machine would otherwise share a single budget, so the tenth journey's
// sign-in fails with "Too many requests" because of the nine before it. Each
// actor gets the next address in 203.0.113.0/24 (reserved for documentation,
// never a real client), so one actor's rapid attempts are still limited the
// way one person's are.
function nextClientAddress() {
  actorCount += 1;
  return `203.0.113.${((actorCount - 1) % 254) + 1}`;
}

// The people a journey acts as, each in its own browser context with its own
// cookie jar, so an owner and an invitee - or a member whose session stays
// open while the owner removes them - are signed in at the same time. An
// actor opens the journey's page, as the journey's user (or as the data set
// user of that name), the first time its name is switched to, and keeps its
// tab as it left it when the journey switches away and back. Every actor sees
// the same viewport and colour scheme. Each actor's context feeds its own
// network counter from before its first navigation, so what the journey
// touched is measured per actor and merged at the end. Each actor's pages also report, through the observe
// binding, the events that completed and the blocks that were ever visible,
// into one set of observations for the whole journey.
function createJourneyActors({
  browser,
  origin,
  basePath,
  pageId,
  path,
  pathParams,
  user,
  urlQuery,
  width,
  height,
  colorScheme,
  timeout,
  dataCookie,
  mutantCookie,
  users = {},
  mainActor,
  recording,
  onContext,
}) {
  const actors = new Map();
  const counters = new Map();
  const observations = createJourneyObservations();
  let currentName;

  // An actor named after a data set user opens as that user; the journey's
  // first actor, and any other name, opens as the journey's user.
  function userFor(name) {
    if (name !== mainActor && Object.prototype.hasOwnProperty.call(users, name)) {
      return users[name];
    }
    return user;
  }

  async function switchTo(name) {
    if (!actors.has(name)) {
      const counter = createNetworkCounter({ origin, basePath });
      counters.set(name, counter);
      const opened = await openPage({
        browser,
        origin,
        pageId,
        path,
        pathParams,
        user: userFor(name),
        urlQuery,
        width,
        height,
        colorScheme,
        clientAddress: nextClientAddress(),
        dataCookie,
        mutantCookie,
        recording: type.isUndefined(recording)
          ? undefined
          : { ...recording, run: { ...recording.run, actor: name } },
        onContext: async (context) => {
          context.on('request', (request) => counter.record(request));
          await context.exposeBinding(OBSERVE_BINDING, (source, message) =>
            observations.receive(message)
          );
          // A caller that watches each actor's context (an explorer walk's
          // error and network buffers) hooks in before its first request.
          if (!type.isUndefined(onContext)) {
            onContext({ context, name });
          }
        },
        timeout,
      });
      actors.set(name, opened);
    }
    currentName = name;
    return actors.get(name);
  }

  function current() {
    return actors.get(currentName);
  }

  function countCalls(query) {
    return counters.get(currentName).countCalls(query);
  }

  // The first URL any actor's context tried to reach on another host of the dev server, which a
  // data set journey must never do (see guardJourneyOrigin).
  function leftOrigin() {
    for (const opened of actors.values()) {
      if (opened.leftOrigin.length > 0) {
        return opened.leftOrigin[0];
      }
    }
    return undefined;
  }

  function networkSnapshots() {
    return [...counters.values()].map((counter) => counter.snapshot());
  }

  // The runner's own look at the current page once a step has settled, beside
  // the observer's samples on every DOM change. A page that is navigating or
  // has crashed has nothing to report.
  async function sampleRendered() {
    const { page } = current();
    try {
      const pageId = await page.evaluate(() => window.lowdefy?.pageId);
      const blockIds = await page.evaluate(collectVisibleBlockIds);
      observations.receive({ kind: 'rendered', pageId, blockIds });
    } catch {
      // Nothing to sample.
    }
  }

  function observed() {
    return observations.snapshot();
  }

  // Closing a context does not reliably fire pagehide, so each actor's dev
  // recorder is flushed first, or the journey's last steps would be lost.
  async function flushRecordings({ capMs = 2000 } = {}) {
    await Promise.all(
      [...actors.values()].map(({ page }) =>
        Promise.race([
          page.evaluate(() => window.__lowdefyRecorder?.flush()).catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, capMs)),
        ])
      )
    );
  }

  async function closeAll() {
    await Promise.all([...actors.values()].map(({ context }) => context.close().catch(() => {})));
  }

  return {
    switchTo,
    current,
    countCalls,
    leftOrigin,
    networkSnapshots,
    sampleRendered,
    observed,
    flushRecordings,
    closeAll,
  };
}

export default createJourneyActors;
