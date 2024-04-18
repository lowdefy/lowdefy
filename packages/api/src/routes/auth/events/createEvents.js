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

import createCreateUserEvent from './createCreateUserEvent.js';
import createLinkAccountEvent from './createLinkAccountEvent.js';
import createSessionEvent from './createSessionEvent.js';
import createSignInEvent from './createSignInEvent.js';
import createSignOutEvent from './createSignOutEvent.js';
import createUpdateUserEvent from './createUpdateUserEvent.js';

function createEvents({ authConfig, logger, plugins }) {
  const events = {
    createUser: createCreateUserEvent({ authConfig, logger, plugins }),
    linkAccount: createLinkAccountEvent({ authConfig, logger, plugins }),
    signIn: createSignInEvent({ authConfig, logger, plugins }),
    signOut: createSignOutEvent({ authConfig, logger, plugins }),
    updateUser: createUpdateUserEvent({ authConfig, logger, plugins }),
  };

  const session = createSessionEvent({ authConfig, plugins });
  if (session) events.session = session;

  return events;
}

export default createEvents;
