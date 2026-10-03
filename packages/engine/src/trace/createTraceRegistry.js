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

// One observation point for completed block and app events. emit and wantsState are the
// engine's; actionView is the read side every action function receives as `trace`.
function createTraceRegistry() {
  const subscribers = [];
  const warnedListeners = new Set();

  function subscribe(listener, { state = false } = {}) {
    const subscriber = { listener, state };
    subscribers.push(subscriber);
    return function unsubscribe() {
      const index = subscribers.indexOf(subscriber);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    };
  }

  function wantsState() {
    return subscribers.some((subscriber) => subscriber.state === true);
  }

  function emit(payload) {
    const statelessPayload = { ...payload, stateBefore: undefined };
    // A copy, so a listener that unsubscribes while it runs does not skip the next one.
    [...subscribers].forEach((subscriber) => {
      // Listeners are plugin code, and analytics must never break an app: a throwing
      // listener is reported once and the others still run.
      try {
        subscriber.listener(subscriber.state === true ? payload : statelessPayload);
      } catch (error) {
        if (!warnedListeners.has(subscriber.listener)) {
          warnedListeners.add(subscriber.listener);
          // eslint-disable-next-line no-console
          console.warn('A Lowdefy trace listener threw an error.', error);
        }
      }
    });
  }

  const registry = { emit, subscribe, wantsState };
  registry.actionView = { subscribe };
  return registry;
}

export default createTraceRegistry;
