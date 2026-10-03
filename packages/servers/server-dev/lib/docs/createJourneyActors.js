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

import createNetworkCounter from './createNetworkCounter.js';
import { openPage } from './getBrowser.js';

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
// actor opens the journey's page, as the journey's user, the first time its
// name is switched to, and keeps its tab as it left it when the journey
// switches away and back. Each actor's context feeds its own network counter
// from before its first navigation, so what the journey touched is measured
// per actor and merged at the end.
function createJourneyActors({
  browser,
  origin,
  basePath,
  pageId,
  user,
  urlQuery,
  width,
  height,
  timeout,
}) {
  const actors = new Map();
  const counters = new Map();
  let currentName;

  async function switchTo(name) {
    if (!actors.has(name)) {
      const counter = createNetworkCounter({ origin, basePath });
      counters.set(name, counter);
      const opened = await openPage({
        browser,
        origin,
        pageId,
        user,
        urlQuery,
        width,
        height,
        clientAddress: nextClientAddress(),
        onContext: (context) => {
          context.on('request', (request) => counter.record(request));
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

  function networkSnapshots() {
    return [...counters.values()].map((counter) => counter.snapshot());
  }

  async function closeAll() {
    await Promise.all([...actors.values()].map(({ context }) => context.close().catch(() => {})));
  }

  return { switchTo, current, countCalls, networkSnapshots, closeAll };
}

export default createJourneyActors;
