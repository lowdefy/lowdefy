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

function getStatePath(directory) {
  return path.join(directory, '.lowdefy', 'upgrade-state.json');
}

function readUpgradeState(directory) {
  const statePath = getStatePath(directory);
  if (!fs.existsSync(statePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function writeUpgradeState(directory, state) {
  const statePath = getStatePath(directory);
  const dir = path.dirname(statePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
}

function clearUpgradeState(directory) {
  const statePath = getStatePath(directory);
  if (fs.existsSync(statePath)) {
    fs.unlinkSync(statePath);
  }
}

export { readUpgradeState, writeUpgradeState, clearUpgradeState };
