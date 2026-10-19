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

import { get, type } from '@lowdefy/helpers';

// { $user: path } is resolved here, on the server, from the request's `user` property
// (evaluated from the session with `_user`). A user value sent by the client is never used.
function resolveUserValue({ value, user, key }) {
  if (!type.isObject(value) || !Object.prototype.hasOwnProperty.call(value, '$user')) {
    return value;
  }
  if (Object.keys(value).length !== 1 || !type.isString(value.$user)) {
    throw new Error(
      `MongoDBTableQuery filter on "${key}" has an invalid "$user" value. Received ${JSON.stringify(
        value
      )}.`
    );
  }
  if (!type.isObject(user)) {
    throw new Error(
      `MongoDBTableQuery filter on "${key}" uses "$user", but the request has no "user" property. Set the request property "user: { _user: true }".`
    );
  }
  const resolved = get(user, value.$user);
  // A missing user value must not become null: a filter like owner eq null would widen
  // the result to every row without an owner.
  if (type.isNone(resolved)) {
    throw new Error(
      `MongoDBTableQuery filter on "${key}" uses "$user: ${value.$user}", which is not set for the current user.`
    );
  }
  return resolved;
}

export default resolveUserValue;
