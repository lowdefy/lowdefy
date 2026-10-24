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

import React, { useMemo } from 'react';

import AppProvider from './AppProvider.js';
import Frame from './Frame.js';
import getShellConfig from '../config/getShellConfig.js';

// The shell opens its one app (shell.json `app`). A shell never opens another app: every app's `_js`
// runs in this one JavaScript realm, beside the app's session token, storage and cache.
function ShellRoot() {
  const shell = useMemo(() => getShellConfig(), []);
  return (
    <AppProvider shell={shell}>
      <Frame />
    </AppProvider>
  );
}

export default ShellRoot;
