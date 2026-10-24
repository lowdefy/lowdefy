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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { acquireMachineSlot, relativePosixPath } from '@lowdefy/node-utils';

import readMemoryPressure from '../hub/readMemoryPressure.js';

const MACHINE_SLOTS = 2;
const WAIT_MS = 20 * 60 * 1000;
const NOTE_INTERVAL_MS = 30 * 1000;

function realDirectory(directory) {
  try {
    return fs.realpathSync(directory);
  } catch {
    return path.resolve(directory);
  }
}

function worktreeSlotName({ configDirectory }) {
  const hash = crypto.createHash('sha1').update(realDirectory(configDirectory)).digest('hex');
  return `journey-run-${hash.slice(0, 12)}`;
}

function machineLimit({ env, readPressure }) {
  const override = Number(env.LOWDEFY_JOURNEY_RUN_SLOTS);
  if (Number.isInteger(override) && override > 0) {
    return override;
  }
  return readPressure() === 'critical' ? 1 : MACHINE_SLOTS;
}

function describeHolder({ holder, now }) {
  const directory = holder.configDirectory ?? 'another app';
  // A run under the current directory by its relative path, any other by its full one.
  let shown = relativePosixPath({ from: process.cwd(), to: directory });
  if (shown === '') {
    shown = '.';
  } else if (shown.startsWith('..')) {
    shown = directory;
  }
  const minutes = Math.max(0, Math.round((now - Date.parse(holder.acquiredAt)) / 60000));
  return `${holder.command ?? 'a journey run'} in ${shown} (pid ${holder.pid}, ${minutes} min)`;
}

/*
Takes the two slots a command that runs journeys holds from before it
resolves a server until its last journey ends: first one run per worktree
(journey-run-<hash of the config directory>, limit 1), so a second run never
uses a server the first will stop; then one of the machine's journey runs
(journey-run, limit 2, or 1 while memory pressure is critical, or
LOWDEFY_JOURNEY_RUN_SLOTS). A run waiting on its worktree holds no machine
slot. Both waits share one 20 minute budget, and a wait that runs out throws
the slot's MACHINE_SLOT_TIMEOUT error. Returns { release } for both.
*/
async function acquireJourneyRunSlots({
  context,
  command,
  acquire = acquireMachineSlot,
  readPressure = readMemoryPressure,
  env = process.env,
}) {
  const configDirectory = context.directories.config;
  const deadline = Date.now() + WAIT_MS;
  function onWait({ holders }) {
    const now = Date.now();
    const running = holders.map((holder) => describeHolder({ holder, now })).join('; ');
    context.logger.info(
      running === ''
        ? 'Waiting for a journey run slot.'
        : `Waiting for a journey run slot. Running now: ${running}.`
    );
  }
  const shared = {
    describe: { command, configDirectory },
    onWait,
    onWaitIntervalMs: NOTE_INTERVAL_MS,
  };
  const worktree = await acquire({
    ...shared,
    name: worktreeSlotName({ configDirectory }),
    limit: 1,
    waitMs: WAIT_MS,
  });
  let machine;
  try {
    machine = await acquire({
      ...shared,
      name: 'journey-run',
      limit: machineLimit({ env, readPressure }),
      waitMs: Math.max(0, deadline - Date.now()),
    });
  } catch (error) {
    worktree.release();
    throw error;
  }
  return {
    release() {
      machine.release();
      worktree.release();
    },
  };
}

export default acquireJourneyRunSlots;
