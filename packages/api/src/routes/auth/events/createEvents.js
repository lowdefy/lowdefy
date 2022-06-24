/*
  Copyright 2020-2022 Lowdefy, Inc

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

function createEvents(context, { authConfig, plugins }) {
  const events = {};

  const createUser = createCreateUserEvent(context, { authConfig, plugins });
  if (createUser) events.createUser = createUser;

  const linkAccount = createLinkAccountEvent(context, { authConfig, plugins });
  if (linkAccount) events.linkAccount = linkAccount;

  const session = createSessionEvent(context, { authConfig, plugins });
  if (session) events.session = session;

  const signIn = createSignInEvent(context, { authConfig, plugins });
  if (signIn) events.signIn = signIn;

  const signOut = createSignOutEvent(context, { authConfig, plugins });
  if (signOut) events.signOut = signOut;

  const updateUser = createUpdateUserEvent(context, { authConfig, plugins });
  if (updateUser) events.updateUser = updateUser;

  return events;
}

export default createEvents;
