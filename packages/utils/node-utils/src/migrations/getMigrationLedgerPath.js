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

// One ledger file per environment, beside the CLI's other state under
// .lowdefy/ (design §4). The path is computed in one place so the build, the
// runner, the CLI and the dev server can never disagree about where a stage's
// ledger lives.
function getMigrationLedgerPath({ configDirectory, stage }) {
  return path.join(configDirectory, '.lowdefy', 'migrations', `${stage}.json`);
}

export default getMigrationLedgerPath;
