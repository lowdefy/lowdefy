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

// Node's fetch (undici) negotiates HTTP/2 by default, and all requests to one
// origin share a single H2 session. The Telegram adapter keeps a getUpdates
// long-poll open on that session, which serializes every other call to
// api.telegram.org behind it - a posted reply would wait until the poll
// returns, i.e. until the NEXT message arrives (or the 30s poll timeout).
// Forcing the global dispatcher to HTTP/1.1 gives each request its own
// pooled connection, the behavior fetch had before H2 became the default.
//
// The dispatcher symbol's version suffix changes across Node releases, so it
// is looked up dynamically, and the replacement reuses Node's own Agent
// class - no undici dependency. Lazily initialized by Node on first fetch,
// hence the throwaway request.
async function disableFetchHttp2({ logger }) {
  await fetch('http://127.0.0.1:1', { signal: AbortSignal.timeout(50) }).catch(() => {});
  const symbol = Object.getOwnPropertySymbols(globalThis).find((s) =>
    s.description?.startsWith('undici.globalDispatcher')
  );
  const dispatcher = symbol ? globalThis[symbol] : undefined;
  if (!dispatcher?.constructor) {
    logger?.warn(
      { event: 'channel_fetch_h2_swap_failed' },
      'Could not resolve the global fetch dispatcher - Telegram replies may be delayed behind the polling long-poll.'
    );
    return;
  }
  const AgentClass = dispatcher.constructor;
  globalThis[symbol] = new AgentClass({ allowH2: false });
}

export default disableFetchHttp2;
