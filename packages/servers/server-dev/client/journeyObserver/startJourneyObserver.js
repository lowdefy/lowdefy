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

const OBSERVE_BINDING = '__lowdefyJourneyObserve';

// Reports what a journey's page runs to the journey runner, through the
// binding the runner exposes on its own browser contexts only
// (lib/docs/createJourneyActors.js): every completed Lowdefy event from the
// engine's trace hook, and every block once it becomes visible, sampled in
// the animation frame after any DOM change so a message shown and cleared
// within one step is still seen. In a developer's tab there is no binding,
// and it does nothing. Returns a stop function, or null when it did not
// start. Never throws into the app: every callback is wrapped.
function startJourneyObserver({ window, lowdefy, getTrace, collectVisibleBlockIds }) {
  const observe = window[OBSERVE_BINDING];
  if (typeof observe !== 'function') {
    return null;
  }

  function forward(message) {
    try {
      Promise.resolve(observe(message)).catch(() => {});
    } catch {
      // The binding is gone with its context; nothing to report to.
    }
  }

  // The hook emits only completed events: bounced debounces and handledBy
  // returns never arrive, so nothing is filtered here.
  const unsubscribe = getTrace(lowdefy).subscribe((payload) => {
    try {
      forward({
        kind: 'event',
        scope: payload.scope,
        pageId: payload.pageId,
        blockId: payload.blockId,
        eventName: payload.eventName,
        actionIds: (payload.actions ?? []).map((action) => action?.id),
      });
    } catch {
      // A payload this observer cannot read is skipped.
    }
  });

  const sent = new Set();
  let frame = null;
  function sample() {
    frame = null;
    try {
      const pageId = lowdefy.pageId;
      const fresh = collectVisibleBlockIds().filter(
        (blockId) => !sent.has(JSON.stringify([pageId, blockId]))
      );
      if (fresh.length === 0) {
        return;
      }
      fresh.forEach((blockId) => sent.add(JSON.stringify([pageId, blockId])));
      forward({ kind: 'rendered', pageId, blockIds: fresh });
    } catch {
      // Sampled again on the next change.
    }
  }

  const observer = new window.MutationObserver(() => {
    if (frame === null) {
      frame = window.requestAnimationFrame(sample);
    }
  });
  // Attributes too: antd shows and hides a modal or an alert by its style and
  // class, without adding or removing nodes.
  observer.observe(window.document.body, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  });
  sample();

  return function stop() {
    unsubscribe();
    observer.disconnect();
    if (frame !== null) {
      window.cancelAnimationFrame(frame);
    }
  };
}

export default startJourneyObserver;
