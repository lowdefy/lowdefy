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

import runEas from './runEas.js';

// Uploads the latest build: TestFlight on iOS, the internal testing track on
// Google Play (eas.json's submit profile). Review and promotion stay with a
// person.
async function runEasSubmit({
  context,
  dryRun,
  environment,
  nonInteractive = false,
  platform,
  projectDirectory,
}) {
  const args = ['submit', '--platform', platform, '--profile', environment, '--latest'];
  if (nonInteractive) {
    args.push('--non-interactive');
  }
  await runEas({ context, args, projectDirectory, dryRun });
}

export default runEasSubmit;
