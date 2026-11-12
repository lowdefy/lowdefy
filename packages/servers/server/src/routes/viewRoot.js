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

import { getRootConfig } from '@lowdefy/api';
import { type } from '@lowdefy/helpers';

// The root config an MCP App view starts its client from, filtered to the view
// session's user: what the web page reads from its HTML, and what
// /api/mobile/root gives a shell. Only a view session is answered. A caller
// with no session gets a 401, which a view reads as an ended session and mints
// a new one for; any other caller gets a 403.
async function viewRootHandler(c) {
  const context = c.get('lowdefyContext');
  if (type.isNone(context.viewSession)) {
    if (type.isNone(context.user)) {
      return c.json({ name: 'AuthenticationError', message: 'A view session is required.' }, 401);
    }
    return c.json({ name: 'AuthorizationError', message: 'A view session is required.' }, 403);
  }
  return c.json(await getRootConfig(context));
}

export default viewRootHandler;
