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

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 5000;

// Collects finished records and sends them: at 20 records, 5 s after the
// first record of a batch, or when flush() is called (pagehide, the stream's
// reload event, a headless run's flush). flush() resolves when every send it
// started has settled.
function createRecordBatcher({ send }) {
  let batch = [];
  let timer = null;

  function flush() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (batch.length === 0) return Promise.resolve();
    const records = batch;
    batch = [];
    return Promise.resolve(send(records)).catch(() => {});
  }

  function add(record) {
    batch.push(record);
    if (batch.length >= BATCH_SIZE) {
      flush();
      return;
    }
    if (timer === null) {
      timer = setTimeout(flush, BATCH_DELAY_MS);
    }
  }

  return { add, flush };
}

export { BATCH_DELAY_MS, BATCH_SIZE };
export default createRecordBatcher;
