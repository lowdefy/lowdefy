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

import createDescribeChain from './createDescribeChain.js';
import createDescribeElement from './createDescribeElement.js';
import createFindBlockType from './createFindBlockType.js';
import createPageIdOf from './createPageIdOf.js';

// Failures emitted before the first replay subscriber, kept for it. PostHog starts in the app's
// onInitAsync, after app onInit has finished, so without these its failures would be lost.
const HELD_FAILURES_LIMIT = 20;

// One observation point for completed block and app events. emit, wantsPayload and wantsState
// are the engine's; actionView is the read side every action function receives as `trace`.
function createTraceRegistry({ lowdefy }) {
  const subscribers = [];
  const warnedListeners = new Set();
  let heldFailures = [];
  let holding = true;

  // Listeners are plugin code, and analytics must never break an app: a throwing listener is
  // reported once and the others still run.
  function callListener(listener, payload) {
    try {
      listener(payload);
    } catch (error) {
      if (!warnedListeners.has(listener)) {
        warnedListeners.add(listener);
        // eslint-disable-next-line no-console
        console.warn('A Lowdefy trace listener threw an error.', error);
      }
    }
  }

  function subscribe(listener, { state = false, replay = false } = {}) {
    const subscriber = { listener, state };
    subscribers.push(subscriber);
    // Only the first replay subscriber takes the held failures; the dev recorder subscribes
    // without replay before the first page, and must not end the holding.
    if (replay === true && holding) {
      const held = heldFailures;
      heldFailures = [];
      holding = false;
      held.forEach((payload) => callListener(listener, payload));
    }
    return function unsubscribe() {
      const index = subscribers.indexOf(subscriber);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    };
  }

  function canHoldFailure() {
    return holding && heldFailures.length < HELD_FAILURES_LIMIT;
  }

  function wantsPayload({ success }) {
    return subscribers.length > 0 || (success === false && canHoldFailure());
  }

  function wantsState() {
    return subscribers.some((subscriber) => subscriber.state === true);
  }

  function emit(payload) {
    const statelessPayload = { ...payload, stateBefore: undefined };
    if (payload.success === false && canHoldFailure()) {
      heldFailures.push(statelessPayload);
    }
    // A copy, so a listener that unsubscribes while it runs does not skip the next one.
    [...subscribers].forEach((subscriber) => {
      callListener(subscriber.listener, subscriber.state === true ? payload : statelessPayload);
    });
  }

  const findBlockType = createFindBlockType({ lowdefy });
  const pageIdOf = createPageIdOf({ lowdefy });
  const describeElement = createDescribeElement({ findBlockType, pageIdOf });
  const describeChain = createDescribeChain({ findBlockType, pageIdOf });

  return {
    describeChain,
    describeElement,
    emit,
    pageIdOf,
    subscribe,
    wantsPayload,
    wantsState,
    actionView: { describeChain, describeElement, pageIdOf, subscribe },
  };
}

export default createTraceRegistry;
