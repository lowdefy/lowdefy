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

const DEFAULT_TIMEOUT_MS = 5000;

// Every HTTP request the CLI makes goes through here, so no silent server can hang a command.
// The timeout covers the whole exchange, reading the body included; timeoutMs 0 sets none, for a
// download or a call the server bounds itself. A caller's own signal aborts it as well.
// Like fetch, it resolves for any HTTP status: the caller checks response.ok.
async function httpFetch({ url, timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...init }) {
  const signals = type.isNone(signal) ? [] : [signal];
  if (timeoutMs !== 0) {
    signals.push(AbortSignal.timeout(timeoutMs));
  }
  try {
    return await fetch(url, { ...init, signal: AbortSignal.any(signals) });
  } catch (error) {
    // fetch rejects a timeout as an abort and a network failure as "fetch failed", with the
    // reason (connect ECONNREFUSED, getaddrinfo ENOTFOUND) as its cause. Callers put the message
    // in their own, so it carries the reason.
    if (error.name === 'TimeoutError') {
      throw new Error(`timeout of ${timeoutMs}ms exceeded`, { cause: error });
    }
    if (error instanceof TypeError && error.cause instanceof Error) {
      throw new Error(error.cause.message, { cause: error });
    }
    throw error;
  }
}

export default httpFetch;
