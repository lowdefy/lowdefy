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

import { type } from '@lowdefy/helpers';

import getDevUsers from './getDevUsers.js';

// The single place a dev tool's `user` value becomes a user object: a name
// declared under auth.dev.users, or an inline object. An unknown name throws,
// never falls back to the roleless default - a tool that silently ran as
// nobody reads as a working app with an empty page.
function resolveDevUser({ user }) {
  if (type.isNone(user)) {
    return undefined;
  }
  if (type.isObject(user)) {
    return user;
  }
  if (type.isString(user)) {
    const devUsers = getDevUsers();
    // hasOwnProperty rather than a truthy lookup, so a name like "constructor"
    // resolves to the declared fixtures only, never to a prototype member.
    if (Object.prototype.hasOwnProperty.call(devUsers, user)) {
      return devUsers[user];
    }
    const declared = Object.keys(devUsers);
    if (declared.length === 0) {
      throw new Error(
        'No dev users are declared. Add auth.dev.users to lowdefy.yaml, or pass an inline user object.'
      );
    }
    throw new Error(
      `Unknown dev user "${user}". Declare it under auth.dev.users in lowdefy.yaml, or pass an inline user object. Declared: ${declared.join(
        ', '
      )}.`
    );
  }
  throw new Error(
    `Headless "user" must be a dev user name or an object. Received ${JSON.stringify(user)}.`
  );
}

export default resolveDevUser;
