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

// True while the event is running and the caller should wait for it. An event that is only
// sleeping in a Wait action until after `deadline`, the time the caller stops waiting, is not
// counted: the caller cannot outlast it, and nothing will change before then because of it.
function isEventRunning({ deadline, event }) {
  if (event?.loading !== true) return false;
  if (!type.isNumber(deadline) || !type.isNumber(event.waitingUntil)) return true;
  return event.waitingUntil <= deadline;
}

// True once the context's onInitAsync is done, or is itself only sleeping until after `deadline`.
function isInitAsyncSettled({ context, deadline }) {
  if (context._internal?.onInitAsyncDone === true) return true;
  const root = context._internal?.RootSlots?.slots?.root?.blocks?.[0];
  const event = root?.Events?.events?.onInitAsync;
  return event?.loading === true && !isEventRunning({ deadline, event });
}

// A page context with nothing left running that the caller, who waits until `deadline` (ms since
// the epoch), could wait out: its onInit and onInitAsync (and the app's) are done, no block event
// is running (an onClick's action chain, an onMountAsync), no request is loading and every
// subscription has connected or failed. An event sleeping in a Wait action past the deadline (a
// page that polls with a Wait) does not count as running. The dev server's isPageReady reads a
// browser tab the same way.
function isContextSettled({ context, deadline, lowdefy }) {
  if (context._internal?.onInitDone !== true) return false;
  if (!isInitAsyncSettled({ context, deadline })) return false;
  const appContext = lowdefy.appContext;
  if (appContext && !isInitAsyncSettled({ context: appContext, deadline })) return false;
  const blocks = Object.values(context._internal?.RootSlots?.map ?? {});
  const running = blocks.some((block) =>
    Object.values(block?.Events?.events ?? {}).some((event) => isEventRunning({ deadline, event }))
  );
  if (running) return false;
  const requests = Object.values(context.requests ?? {});
  if (requests.some((calls) => calls?.[0]?.loading)) return false;
  const channels = Object.values(context.websockets ?? {});
  return channels.every((channel) => channel?.connected === true || Boolean(channel?.error));
}

export default isContextSettled;
