/*
  Copyright 2020-2024 Lowdefy, Inc

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

import runStart from './runStart.js';
// TODO: Handle "spawn yarn ENOENT" error if no built server exists.

async function build({ context }) {
  context.sendTelemetry({ sendTypes: true });
  const serverProcess = runStart({ context, directory: context.directories.server });
  context.print.succeed('Started server.');
  await serverProcess;
}

export default build;
