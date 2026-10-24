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

// --rollout <percent>, as eas update's --rollout-percentage takes it.
function parseRollout(rollout) {
  const percent = Number(rollout);
  if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
    throw new Error(
      `--rollout should be a whole percentage from 1 to 100. Received ${JSON.stringify(rollout)}.`
    );
  }
  return percent;
}

export default parseRollout;
