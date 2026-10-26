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

import acquireJourneyRunSlots from './acquireJourneyRunSlots.js';

const BUSY_EXIT_CODE = 75;
const MACHINE_SLOT = 'journey-run';

/*
Takes the journey run slots for a command, or, when the wait for them runs
out, says the machine is busy and sets exit code 75 (EX_TEMPFAIL) so an agent
backs off instead of starting its own server. Any slot but the machine's is
this worktree's, held by another run here. The timeout is caught here,
before runCommand's catch would exit 1. Nothing has been started or written
at that point. Returns { release }, or null when the machine is busy.
*/
async function takeJourneyRunSlots({ context, command, acquire = acquireJourneyRunSlots }) {
  try {
    return await acquire({ context, command });
  } catch (error) {
    if (error.code !== 'MACHINE_SLOT_TIMEOUT') {
      throw error;
    }
    if (error.slot === MACHINE_SLOT) {
      context.logger.error(
        'The machine is busy running other journeys. Try again later; do not start your own dev server.'
      );
    } else {
      context.logger.error(
        'Another journey run in this worktree is still going. Wait for it to finish; do not start your own dev server.'
      );
    }
    context.sendTelemetry();
    process.exitCode = BUSY_EXIT_CODE;
    return null;
  }
}

export default takeJourneyRunSlots;
