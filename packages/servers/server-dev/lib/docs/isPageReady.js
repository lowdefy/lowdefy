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

// Serialized into the browser by page.waitForFunction, so this function must
// be pure: it may reference nothing but `window` and its argument. An import
// or a closed-over binding would be undefined once the source is evaluated
// inside the page, which is why its helpers are declared inside it.
//
// Checks are ordered cheapest-first and return false on the first failure.
// A missing key always means "not configured", never "not finished" —
// iterating only the entries that exist gives that for free.
//
// It reads the instance the app is showing, the most recently rendered
// instance of the shown page, so a caller waits out a redirect (a protected
// page sending a signed-out caller to sign in) instead of waiting for a page
// that will never mount.
//
// No page is ready while the app is between pages: a client navigation (a
// Link, even one in onInit) has changed the URL, but window.lowdefy.pageId
// still names the page being left until the next page renders (the dev
// client's Routing.jsx and Page.jsx mark that span).
//
// `deadline` is the time (ms since the epoch) at which the caller stops
// waiting. An event is loading for its whole run, and the engine marks one
// that only sleeps in a Wait action with the time the wait ends
// (waitingUntil, see createWait in @lowdefy/engine). An event that sleeps
// until after the deadline is not counted as running: the caller could not
// outlast it, and nothing changes because of it before then, so a page that
// polls with a Wait (sleep a minute, read again, run again) settles once its
// real work is done. A wait that ends before the deadline (a debounce before
// a request) still holds the page. With no deadline every loading event
// counts.
function isPageReady({ deadline } = {}) {
  function isEventRunning(event) {
    if (event?.loading !== true) return false;
    if (typeof deadline !== 'number' || typeof event.waitingUntil !== 'number') return true;
    return event.waitingUntil <= deadline;
  }
  // onInitAsync is done, or is itself only sleeping until after the deadline.
  function isInitAsyncSettled(ctx) {
    if (ctx._internal?.onInitAsyncDone === true) return true;
    const event = ctx._internal?.RootSlots?.slots?.root?.blocks?.[0]?.Events?.events?.onInitAsync;
    return event?.loading === true && !isEventRunning(event);
  }

  const lowdefy = window.lowdefy;
  if (lowdefy?._devNavigating === true) return false;
  const shownKey = lowdefy?.pageInstances?.[lowdefy?.pageId]?.at(-1);
  const context = lowdefy?.contexts?.[shownKey];
  if (!context) return false;

  if (context._internal?.onInitDone !== true) return false;
  // runOnInitAsync is always invoked once runOnInit resolves, so this settles
  // even for a page that declares no onInitAsync event.
  if (!isInitAsyncSettled(context)) return false;
  // The app onInitAsync runs once per app load, alongside the first page's events.
  const appContext = lowdefy?.appContext;
  if (appContext && !isInitAsyncSettled(appContext)) return false;

  // Covers onMountAsync (fired without await by Block.js) and any other event
  // still running, such as an onClick from an earlier tool call.
  const blocks = Object.values(context._internal?.RootSlots?.map ?? {});
  for (const block of blocks) {
    const events = Object.values(block?.Events?.events ?? {});
    if (events.some(isEventRunning)) return false;
  }

  const requests = Object.values(context.requests ?? {});
  if (requests.some((calls) => calls?.[0]?.loading)) return false;

  // A subscription is settled once it has connected or failed; a page with no
  // subscriptions has {} and passes.
  const channels = Object.values(context.websockets ?? {});
  if (channels.some((channel) => channel?.connected !== true && !channel?.error)) return false;

  // Lazy blocks on screen still showing their fallback (createLazyBlock in
  // @lowdefy/block-utils). The global is absent until a lazy block first
  // mounts, and absent means none are loading.
  if ((window.__lowdefyLazyLoads ?? 0) > 0) return false;
  // Tables holding their loading skeleton for its minimum time after the
  // load (useSkeletonTiming in @lowdefy/blocks-antd): their rows are about to
  // replace it. Absent, like the lazy count, until a table first holds one.
  if ((window.__lowdefySkeletonHolds ?? 0) > 0) return false;

  return true;
}

export default isPageReady;
