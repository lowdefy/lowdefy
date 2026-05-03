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

function createAuditQueue({ size, interval, flushFn, onError }) {
  let buffer = [];
  let timer = null;
  let stopped = false;
  let inFlightFlush = null;

  function scheduleTimer() {
    if (timer || stopped) return;
    timer = setTimeout(() => {
      timer = null;
      flush().catch(() => {});
    }, interval);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  async function flush() {
    if (buffer.length === 0) return undefined;
    const batch = buffer;
    buffer = [];
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    inFlightFlush = (async () => {
      try {
        await flushFn(batch);
      } catch (err) {
        if (onError) onError(err);
      } finally {
        inFlightFlush = null;
      }
    })();
    return inFlightFlush;
  }

  function enqueue(event) {
    if (stopped) return;
    buffer.push(event);
    if (buffer.length >= size) {
      flush().catch(() => {});
      return;
    }
    scheduleTimer();
  }

  async function stop() {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    await flush();
    if (inFlightFlush) {
      await inFlightFlush;
    }
  }

  return {
    enqueue,
    flush,
    stop,
    get pending() {
      return buffer.length;
    },
  };
}

export default createAuditQueue;
