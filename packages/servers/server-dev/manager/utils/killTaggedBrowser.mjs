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

import { spawn } from 'child_process';

// Kills the browser a Vite child launched, found by the tag the manager gave
// that child (see launchBrowser.js). A child that exits normally already
// takes its browser with it; this is for one killed outright, whose system
// Chrome runs in its own process group and is left running. Chrome's helper
// processes do not carry the tag; they exit with the browser process.
function killTaggedBrowser({ tag }) {
  // Windows has no pkill. Best effort, as for the other process clean-up:
  // the headless shell, the default browser, exits with its parent anyway.
  if (process.platform === 'win32') {
    return;
  }
  // pkill exits 1 when nothing matched, the usual case.
  const pkill = spawn('pkill', ['-f', '--', `--lowdefy-browser-tag=${tag}`], { stdio: 'ignore' });
  pkill.on('error', () => {});
}

export default killTaggedBrowser;
