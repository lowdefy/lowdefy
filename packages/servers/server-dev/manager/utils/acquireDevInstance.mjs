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

import { getDevInstancePath, readDevInstance } from '@lowdefy/node-utils';

function writeRecord({ instancePath, record }) {
  // Written whole and renamed into place so readers never see half a record.
  const temporaryPath = `${instancePath}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(instancePath), { recursive: true });
  fs.writeFileSync(temporaryPath, `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporaryPath, instancePath);
}

// One dev server per app. Two managers on one app race each other's builds -
// one wedges on a half-deleted pages directory and keeps serving a stale build
// with no error anywhere - so the second refuses. The record doubles as the
// discovery file: the CLI, the MCP shim and the hub read it to find this
// server's port, owner and readiness without a registry of their own.
// Creating the file exclusively decides a race between two managers starting
// at once: exactly one create succeeds.
function createRecord({ instancePath, record }) {
  fs.mkdirSync(path.dirname(instancePath), { recursive: true });
  try {
    const fd = fs.openSync(instancePath, 'wx', 0o600);
    fs.writeSync(fd, `${JSON.stringify(record, null, 2)}\n`);
    fs.closeSync(fd);
    return true;
  } catch (error) {
    if (error.code === 'EEXIST') {
      return false;
    }
    throw error;
  }
}

function acquireDevInstance({ configDirectory, owner, version }) {
  const instancePath = getDevInstancePath({ configDirectory });
  let record = {
    pid: process.pid,
    configDirectory: fs.realpathSync(configDirectory),
    owner,
    state: 'starting',
    version,
    startedAt: new Date().toISOString(),
  };
  if (!createRecord({ instancePath, record })) {
    const holder = readDevInstance({ configDirectory });
    if (holder !== null && holder.pid !== process.pid) {
      return { acquired: false, holder, instancePath };
    }
    // Stale: the holder exited, or the file was copied from another checkout.
    fs.rmSync(instancePath, { force: true });
    if (!createRecord({ instancePath, record })) {
      return { acquired: false, holder: readDevInstance({ configDirectory }) ?? {}, instancePath };
    }
  }

  function update(fields) {
    record = { ...record, ...fields };
    writeRecord({ instancePath, record });
  }

  function release() {
    try {
      const current = JSON.parse(fs.readFileSync(instancePath, 'utf8'));
      if (current.pid === process.pid) {
        fs.rmSync(instancePath, { force: true });
      }
    } catch {
      // Already gone, or taken over after a crash - nothing to release.
    }
  }

  return { acquired: true, instancePath, release, update };
}

export default acquireDevInstance;
