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

// The most posts the backlog keeps; older ones are dropped first, so a phone left offline for days
// does not fill its store.
const MAX_ENTRIES = 500;

/**
 * Background posts that could not be sent (no signal, no session), kept in the device store and
 * sent on the next wake, oldest first, as { endpointId, payload }.
 *
 * @param {Object} params
 * @param {string} params.key The device store key.
 * @param {{ get, set }} params.kv The device store.
 */
function createBacklog({ key, kv }) {
  function read() {
    return JSON.parse(kv.get(key) ?? '[]');
  }
  function write(entries) {
    kv.set(key, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  }
  return {
    add(entry) {
      write([...read(), entry]);
    },
    // Sends every kept post with `send`, stopping at the first failure; the rest stay.
    async flush(send) {
      const entries = read();
      let sent = 0;
      for (const entry of entries) {
        try {
          await send(entry);
        } catch (error) {
          break;
        }
        sent += 1;
      }
      // Read again: a post added while these were sending stays behind them.
      write(read().slice(sent));
      return sent;
    },
    size: () => read().length,
  };
}

export default createBacklog;
