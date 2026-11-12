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

const MAIN_ACTOR = 'main';

// The people of a headless journey, as a browser journey's actors: it starts as "main", the
// journey's user, and an `as` step switches to another, opening the journey's first page for
// one met for the first time. A name that is a user of the data set is that user; any other name
// is another person signed in as the journey's user, as in the browser runner.
function createHeadlessActors({ host, onTrace, plugins, start, stepTimeout, user }) {
  const actors = new Map();
  let currentName = MAIN_ACTOR;

  function userFor(name) {
    if (name !== MAIN_ACTOR && host.userNames.includes(name)) {
      return name;
    }
    return user;
  }

  function create(name) {
    const actor = createHeadlessActor({
      host,
      name,
      onTrace,
      plugins,
      stepTimeout,
      user: userFor(name),
    });
    actors.set(name, actor);
    return actor;
  }

  async function open() {
    await create(MAIN_ACTOR).load(start);
  }

  async function switchTo(name) {
    if (!actors.has(name)) {
      await create(name).load(start);
    }
    currentName = name;
  }

  return {
    all: () => [...actors.values()],
    current: () => actors.get(currentName),
    open,
    switchTo,
  };
}

export default createHeadlessActors;
