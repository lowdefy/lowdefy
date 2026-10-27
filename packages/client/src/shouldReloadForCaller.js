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

import { shouldReloadForCaller as shouldReloadForCallerCore } from '@lowdefy/client-core';

import createWebStore from './host/createWebStore.js';

// shouldReloadForCaller over the tab's sessionStorage, for the server
// templates' page navigation.
function shouldReloadForCaller({ serverCaller, user, window }) {
  return shouldReloadForCallerCore({
    serverCaller,
    sessionStorage: createWebStore(() => window.sessionStorage),
    user,
  });
}

export default shouldReloadForCaller;
