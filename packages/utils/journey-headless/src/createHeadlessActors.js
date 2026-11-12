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

import createHeadlessActor from './createHeadlessActor.js';

import { type } from '@lowdefy/helpers';

const MAIN_ACTOR = 'main';

// The people of a headless journey, as a browser journey's actors: it starts as "main", the
// journey's user, and an `as` step switches to another, opening the journey's first page for
// one met for the first time. A name that is a user of the data set is that user; any other name
// is another person signed in as the journey's user, as in the browser runner. A page-less
// journey (no start pageId) opens no page.
function createHeadlessActors({ host, onTrace, plugins, start, stepTimeout, user }) {
  const actors = new Map();
  let currentName = MAIN_ACTOR;

  function userFor(name) {
    if (name !== MAIN_ACTOR && host.userNames.includes(name)) {
      return name;
    }
    return user;
  }

  function create({ name, actorUser }) {
    const actor = createHeadlessActor({
      host,
      name,
      onTrace,
      plugins,
      stepTimeout,
      user: actorUser,
    });
    actors.set(name, actor);
    return actor;
  }

  async function openActor({ name, actorUser }) {
    if (actors.has(name)) {
      return actors.get(name);
    }
    const actor = create({ name, actorUser });
    if (!type.isNone(start.pageId)) {
      await actor.load(start);
    }
    return actor;
  }

  async function open() {
    await openActor({ name: MAIN_ACTOR, actorUser: user });
  }

  async function switchTo(name) {
    await openActor({ name, actorUser: userFor(name) });
    currentName = name;
  }

  // Who a call or request step calls as, without switching the actor the journey acts as, as the
  // browser runner picks it: the current actor when the step names no one, the actor of that name
  // for a name, and an actor of its own for "none" (signed out) or an inline user object. Its
  // calls are recorded on that actor, for expect.calls.
  async function callerFor(as) {
    if (type.isUndefined(as)) {
      return actors.get(currentName);
    }
    if (as === 'none' || type.isObject(as)) {
      // Spaced, so it never takes the name of an actor an `as` step opened.
      return openActor({ name: `user ${JSON.stringify(as)}`, actorUser: as });
    }
    return openActor({ name: as, actorUser: userFor(as) });
  }

  return {
    all: () => [...actors.values()],
    callerFor,
    current: () => actors.get(currentName),
    open,
    switchTo,
  };
}

export default createHeadlessActors;
