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

import signedOutCaller from './signedOutCaller.js';

// Who a caller is, in the forms a journey's `user` takes: "none" for a signed out caller, the
// name of a user in the session's data set, or a user object. Returns the user object, or null
// for a signed out caller.
function resolveSessionUser({ testSession, user }) {
  if (user === signedOutCaller) return null;
  if (type.isObject(user)) return user;
  const { dataSet } = testSession;
  if (!type.isString(user) || user === '') {
    throw new Error(
      `as() takes a user: the name of a user in the session's data set, a user object such as { id: "u1", roles: ["admin"] }, or "none" for a signed out caller. Received ${JSON.stringify(
        user
      )}.`
    );
  }
  if (!Object.hasOwn(dataSet.users, user)) {
    const names = Object.keys(dataSet.users);
    const known =
      names.length > 0
        ? `Its users are ${names.map((name) => `"${name}"`).join(', ')}.`
        : 'It has no users.';
    const where = testSession.named
      ? `data set "${dataSet.name}"`
      : 'the session, which was opened without a data set';
    throw new Error(`User "${user}" is not in ${where}. ${known}`);
  }
  return dataSet.users[user];
}

export default resolveSessionUser;
