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

import fs from 'fs';
import path from 'path';
import { type } from '@lowdefy/helpers';

import isProcessAlive from './isProcessAlive.js';

function listRecordFiles({ directory }) {
  try {
    return fs.readdirSync(directory).filter((name) => name.endsWith('.json'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function readRecord({ recordPath }) {
  try {
    return JSON.parse(fs.readFileSync(recordPath, 'utf8'));
  } catch {
    // Removed between the listing and the read, or not a record.
    return null;
  }
}

// The one reader of the server registry that registerServer writes. A record
// whose process is gone is stale: it is deleted and skipped. A live record is
// prunable only when its owner is gone; a live owner means the server is
// wanted, whatever else is true of it (nohup, a service, a hub restart).
function readServerRegistry({ directory }) {
  const records = [];
  listRecordFiles({ directory }).forEach((name) => {
    const recordPath = path.join(directory, name);
    const record = readRecord({ recordPath });
    // Every record names an owner; one that does not is no proof of anything.
    if (!type.isObject(record) || !type.isInt(record.pid) || !type.isInt(record.owner?.pid)) {
      return;
    }
    if (!isProcessAlive({ pid: record.pid, processStartTime: record.processStartTime })) {
      fs.rmSync(recordPath, { force: true });
      return;
    }
    const ownerAlive = isProcessAlive({
      pid: record.owner.pid,
      processStartTime: record.owner.processStartTime,
    });
    // Without a start time (unreadable when the record was written, or a
    // Windows record from before Windows had one) the pid alone cannot prove
    // this is still the server: a reused pid would be taken for it and
    // signalled.
    const provable = !type.isNone(record.processStartTime);
    records.push({ ...record, recordPath, ownerAlive, prunable: provable && !ownerAlive });
  });
  return records;
}

export default readServerRegistry;
