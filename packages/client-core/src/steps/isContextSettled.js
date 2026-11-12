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

// A page context with nothing left running: its onInit and onInitAsync (and the app's) are done, no
// block event is running (an onClick's action chain, an onMountAsync), no request is loading and
// every subscription has connected or failed. The dev server's isPageReady reads a browser tab the
// same way.
function isContextSettled({ context, lowdefy }) {
  if (context._internal?.onInitDone !== true) return false;
  if (context._internal?.onInitAsyncDone !== true) return false;
  const appContext = lowdefy.appContext;
  if (appContext && appContext._internal?.onInitAsyncDone !== true) return false;
  const blocks = Object.values(context._internal?.RootSlots?.map ?? {});
  const running = blocks.some((block) =>
    Object.values(block?.Events?.events ?? {}).some((event) => event?.loading === true)
  );
  if (running) return false;
  const requests = Object.values(context.requests ?? {});
  if (requests.some((calls) => calls?.[0]?.loading)) return false;
  const channels = Object.values(context.websockets ?? {});
  return channels.every((channel) => channel?.connected === true || Boolean(channel?.error));
}

export default isContextSettled;
