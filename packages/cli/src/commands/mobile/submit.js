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

import config from './config.js';
import runEasSubmit from './runEasSubmit.js';

// lowdefy mobile submit: uploads the latest build of the environment to
// TestFlight and Google Play internal testing, and nothing more.
async function mobileSubmit({ context }) {
  const { nonInteractive = false, platform = 'all' } = context.options;
  const dryRun = context.options.dryRun === true;
  const { environment, projectDirectory } = await config({ context });
  await runEasSubmit({
    context,
    dryRun,
    environment,
    nonInteractive,
    platform,
    projectDirectory,
  });
  context.logger.info(
    'Uploaded only. Submitting the TestFlight build for review and promoting the Play release from internal testing are steps for a person: see lowdefy mobile checklist.'
  );
}

export default mobileSubmit;
