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
// be pure: it may reference nothing but `window` and its own argument. An
// import or a closed-over binding would be undefined once the source is
// evaluated inside the page.
//
// Checks are ordered cheapest-first and return false on the first failure.
// A missing key always means "not configured", never "not finished" —
// iterating only the entries that exist gives that for free.
function isPageReady(pageId) {
  const context = window.lowdefy?.contexts?.['page:' + pageId];
  if (!context) return false;

  if (context._internal?.onInitDone !== true) return false;
  // runOnInitAsync is always invoked once runOnInit resolves, so this settles
  // even for a page that declares no onInitAsync event.
  if (context._internal?.onInitAsyncDone !== true) return false;

  // Covers onMountAsync (fired without await by Block.js) and any other event
  // still running, such as an onClick from an earlier tool call.
  const blocks = Object.values(context._internal?.RootSlots?.map ?? {});
  for (const block of blocks) {
    const events = Object.values(block?.Events?.events ?? {});
    if (events.some((event) => event?.loading === true)) return false;
  }

  const requests = Object.values(context.requests ?? {});
  if (requests.some((calls) => calls?.[0]?.loading)) return false;

  // A subscription is settled once it has connected or failed; a page with no
  // subscriptions has {} and passes.
  const channels = Object.values(context.websockets ?? {});
  if (channels.some((channel) => channel?.connected !== true && !channel?.error)) return false;

  return true;
}

export default isPageReady;
