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

// A mutant's status from its verdicts: killed when a journey on its path killed
// it, survived when every journey survived it, unapplied when every journey
// passed and none applied it, errored otherwise; changed when a config edit
// removed it during the run, and not run when nothing ran it.
function mutantStatus({ verdicts, changed }) {
  if (changed) {
    return 'changed';
  }
  if (verdicts.length === 0) {
    return 'not run';
  }
  if (verdicts.some(({ verdict }) => verdict === 'killed')) {
    return 'killed';
  }
  if (verdicts.every(({ verdict }) => verdict === 'survived')) {
    return 'survived';
  }
  if (verdicts.every(({ verdict }) => verdict === 'unapplied')) {
    return 'unapplied';
  }
  return 'errored';
}

export default mutantStatus;
