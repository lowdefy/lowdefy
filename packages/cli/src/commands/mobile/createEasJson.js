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

import EAS_CLI_VERSION from './easCliVersion.js';

const SHELL_CONFIG = './shell.json';

// One build and submit profile per environment, named after it, so
// `eas build --profile staging` builds a binary that listens on the staging
// channel. Build numbers live in EAS (appVersionSource remote), so two
// machines never collide and nothing is committed.
function createEasJson({ environments }) {
  const build = {};
  const submit = {};
  environments.forEach((environment) => {
    build[environment] = {
      channel: environment,
      autoIncrement: true,
      distribution: 'store',
      env: { LOWDEFY_SHELL_CONFIG: SHELL_CONFIG, LOWDEFY_SHELL_VARIANT: 'release' },
    };
    submit[environment] = { android: { track: 'internal' } };
  });
  build.development = {
    developmentClient: true,
    distribution: 'internal',
    env: { LOWDEFY_SHELL_CONFIG: SHELL_CONFIG, LOWDEFY_SHELL_VARIANT: 'dev' },
  };
  return {
    cli: { version: EAS_CLI_VERSION, appVersionSource: 'remote' },
    build,
    submit,
  };
}

export default createEasJson;
