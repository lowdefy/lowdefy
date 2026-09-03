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
import path from 'path';
import setupWatcher from '../utils/setupWatcher.mjs';

// .lowdefy/ is a dotfile path the config watcher ignores, but the stage
// ledgers under .lowdefy/migrations/ feed the build (the index carries
// `applied` per migration), so a ledger rewrite — lowdefy migrate, a git
// pull of a CI ledger commit — rebuilds so build status and the serving
// preflight see the new state.
function migrationLedgerWatcher(context) {
  const callback = async () => {
    context.logger.info('Migration ledger changed, rebuilding.');
    await context.lowdefyBuild();
    await context.reloadClients();
  };
  return setupWatcher({
    callback,
    context,
    watchDotfiles: true,
    watchPaths: [path.join(context.directories.config, '.lowdefy', 'migrations')],
  });
}

export default migrationLedgerWatcher;
