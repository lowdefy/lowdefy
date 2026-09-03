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

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but belongs to another user.
    return error.code === 'EPERM';
  }
}

// `lowdefy dev` writes .manager.lock into its server directory
// (packages/servers/server-dev/manager/utils/acquireManagerLock.mjs). A lock
// held by a live pid means a development server is already serving this app, so
// the runner drives that server rather than booting a second one. The port is
// only known when the manager records it in the lock; without it the caller
// falls back to its own server.
function detectRunningDevServer({ devDirectory }) {
  let holder;
  try {
    holder = JSON.parse(fs.readFileSync(path.join(devDirectory, '.manager.lock'), 'utf8'));
  } catch {
    return { running: false };
  }
  if (!type.isInt(holder.pid) || !isPidAlive(holder.pid)) {
    return { running: false };
  }
  if (!type.isInt(holder.port)) {
    return { running: true, pid: holder.pid };
  }
  return { running: true, pid: holder.pid, url: `http://localhost:${holder.port}` };
}

export default detectRunningDevServer;
