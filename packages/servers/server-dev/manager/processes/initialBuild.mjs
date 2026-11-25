#!/usr/bin/env node
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

import { ldfTime, ldfTimeSync } from '../utils/ldfProf.mjs';

function initialBuild(context) {
  return async () => {
    ldfTimeSync('mgr:readDotEnv', () => context.readDotEnv());
    // This build holds its warnings for plugins it could not check: the install
    // below adds them, and checkPendingPlugins builds again once the server
    // answers, warning for any still missing.
    await ldfTime('mgr:initialLowdefyBuild', () =>
      context.lowdefyBuild({ pluginInstallFollows: true })
    );
    await ldfTime('mgr:checkMockUserWarning', () => context.checkMockUserWarning());
    await ldfTime('mgr:installPlugins', () => context.installPlugins());
  };
}

export default initialBuild;
