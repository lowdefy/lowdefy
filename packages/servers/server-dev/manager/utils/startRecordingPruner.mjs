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

import pruneRecordings from './pruneRecordings.mjs';

const HOUR_MS = 60 * 60 * 1000;

// Runs in the manager, which lives as long as the session (the server child
// restarts). Pruning runs whether or not recording is on, so old traces still
// age out after a developer turns recording off. A failure is logged at debug
// and never stops the dev server.
function startRecordingPruner({ configDirectory, logger, intervalMs = HOUR_MS }) {
  function prune() {
    try {
      const deleted = pruneRecordings({ configDirectory });
      const count = deleted.directories.length + deleted.files.length;
      if (count > 0) {
        logger.debug(
          `Pruned ${deleted.directories.length} recording date directories and ${deleted.files.length} recording files.`
        );
      }
    } catch (error) {
      logger.debug(`Pruning dev recordings failed: ${error.message}`);
    }
  }
  prune();
  const interval = setInterval(prune, intervalMs);
  interval.unref();
  return interval;
}

export default startRecordingPruner;
