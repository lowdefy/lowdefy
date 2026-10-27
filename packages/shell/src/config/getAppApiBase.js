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

import { LowdefyInternalError } from '@lowdefy/errors';

// The app server's URL for the shell's environment (shell.json `environment`), without a trailing
// slash. Each app's urls come from its environments; Lowdefy Dev reads lowdefy dev's. checkShellConfig
// refuses a shell.json with no url for its environment, so a missing one is a Lowdefy wiring bug.
function getAppApiBase({ app, environment }) {
  const url = app.urls?.[environment];
  if (typeof url !== 'string' || url.length === 0) {
    throw new LowdefyInternalError(
      `Shell app "${app.id}" has no url for environment "${environment}". Received ${JSON.stringify(
        app.urls
      )}.`
    );
  }
  return url.replace(/\/+$/, '');
}

export default getAppApiBase;
