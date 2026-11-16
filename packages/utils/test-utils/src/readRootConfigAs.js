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

import checkSessionOpen from './checkSessionOpen.js';
import createCallContext from './createCallContext.js';

// The root config the page route sends a client with every page, as the caller sees it (menus are
// filtered by the caller's roles), as JSON, the form the HTML embeds it in.
async function readRootConfigAs({ testSession, user }) {
  checkSessionOpen({ testSession });
  const context = createCallContext({
    faults: [],
    req: { url: '/', method: 'GET', hostname: 'localhost' },
    testSession,
    user,
  });
  const rootConfig = await testSession.testApp.modules.api.getRootConfig(context);
  return JSON.parse(JSON.stringify(rootConfig));
}

export default readRootConfigAs;
