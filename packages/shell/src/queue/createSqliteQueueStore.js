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

// The offline request queue in SQLite: per app, the `offline: queue` requests the shell kept while
// it had no signal, in the order they were made, each with the body it will send unchanged.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS request_queue (
  id TEXT PRIMARY KEY NOT NULL,
  app_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  url TEXT NOT NULL,
  body TEXT NOT NULL,
  build_id TEXT,
  page_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  attempts INTEGER NOT NULL,
  queued_at TEXT NOT NULL
);
`;

function toItem(row) {
  return {
    id: row.id,
    url: row.url,
    body: JSON.parse(row.body),
    buildId: row.build_id,
    pageId: row.page_id,
    requestId: row.request_id,
    status: row.status,
    error: row.error,
    attempts: row.attempts,
    queuedAt: row.queued_at,
  };
}

/**
 * @param {Object} params
 * @param {Object} params.db An expo-sqlite database (openDatabaseSync).
 */
function createSqliteQueueStore({ db }) {
  let ready = null;
  function init() {
    if (ready === null) {
      ready = db.execAsync(SCHEMA);
    }
    return ready;
  }

  return {
    async add({ appId, item }) {
      await init();
      const last = await db.getFirstAsync(
        'SELECT MAX(seq) AS seq FROM request_queue WHERE app_id = ?',
        [appId]
      );
      await db.runAsync(
        'INSERT INTO request_queue (id, app_id, seq, url, body, build_id, page_id, request_id, status, error, attempts, queued_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          item.id,
          appId,
          (last?.seq ?? 0) + 1,
          item.url,
          JSON.stringify(item.body),
          item.buildId ?? null,
          item.pageId,
          item.requestId,
          'pending',
          null,
          0,
          item.queuedAt,
        ]
      );
    },
    async list({ appId }) {
      await init();
      const rows = await db.getAllAsync(
        'SELECT * FROM request_queue WHERE app_id = ? ORDER BY seq',
        [appId]
      );
      return rows.map(toItem);
    },
    async update({ id, status, error = null, attempts }) {
      await init();
      await db.runAsync(
        'UPDATE request_queue SET status = ?, error = ?, attempts = ? WHERE id = ?',
        [status, error, attempts, id]
      );
    },
    async remove({ id }) {
      await init();
      await db.runAsync('DELETE FROM request_queue WHERE id = ?', [id]);
    },
    async removeFailed({ appId }) {
      await init();
      await db.runAsync("DELETE FROM request_queue WHERE app_id = ? AND status = 'failed'", [
        appId,
      ]);
    },
    async removeApp({ appId }) {
      await init();
      await db.runAsync('DELETE FROM request_queue WHERE app_id = ?', [appId]);
    },
  };
}

export default createSqliteQueueStore;
