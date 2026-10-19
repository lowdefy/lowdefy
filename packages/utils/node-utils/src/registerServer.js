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

import getProcessStartTime from './getProcessStartTime.js';

function getOwner({ env }) {
  if (!type.isNone(env.LOWDEFY_EXIT_WITH_PID) && env.LOWDEFY_EXIT_WITH_PID !== '') {
    const pid = Number(env.LOWDEFY_EXIT_WITH_PID);
    return { pid, processStartTime: getProcessStartTime({ pid }), via: 'exit-with-pid' };
  }
  // Only the CLI sets the registry directory, so without a named owner the
  // parent is the CLI that spawned this process.
  return {
    pid: process.ppid,
    processStartTime: getProcessStartTime({ pid: process.ppid }),
    via: 'cli',
  };
}

function writeRecord({ recordPath, record }) {
  // Written whole and renamed into place so readers never see half a record.
  const temporaryPath = `${recordPath}.tmp`;
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  fs.writeFileSync(temporaryPath, `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporaryPath, recordPath);
}

// The machine-wide list of Lowdefy server processes and their owners, read by
// `lowdefy hub ps|prune` to find servers whose owner is gone. It lives outside
// the app, so it survives a deleted git worktree. Only the CLI sets the
// directory: a server run directly (Docker, Vercel, systemd) writes nothing.
// Best-effort: a server whose home cannot be written runs on unregistered.
function registerServer({ kind, port, configDirectory, env = process.env, logger = console }) {
  const directory = env.LOWDEFY_SERVER_REGISTRY_DIR;
  if (type.isNone(directory) || directory === '') {
    return null;
  }
  const recordPath = path.join(directory, `${process.pid}.json`);
  let record = {
    pid: process.pid,
    processStartTime: getProcessStartTime({ pid: process.pid }),
    kind,
    cwd: process.cwd(),
    configDirectory: type.isNone(configDirectory) ? null : path.resolve(configDirectory),
    port: port ?? null,
    owner: getOwner({ env }),
    startedAt: new Date().toISOString(),
  };

  try {
    writeRecord({ recordPath, record });
  } catch (error) {
    logger.warn(`Could not register this server in ${directory}: ${error.message}`);
    return null;
  }

  function update(fields) {
    record = { ...record, ...fields };
    try {
      writeRecord({ recordPath, record });
    } catch (error) {
      logger.warn(`Could not update this server's record in ${directory}: ${error.message}`);
    }
  }

  function release() {
    try {
      const current = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
      if (current.pid === process.pid) {
        fs.rmSync(recordPath, { force: true });
      }
    } catch {
      // Already gone - nothing to release.
    }
  }

  process.on('exit', release);

  return { recordPath, update, release };
}

export default registerServer;
