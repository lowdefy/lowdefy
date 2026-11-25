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

function isNonEmptyString(value) {
  return type.isString(value) && value !== '';
}

// The binding a system call names, checked as a CallApi checks its "organization" and "caller":
// an organization id, and a stand-in caller { id, name } only inside an organization.
function checkSystemBinding({ caller, organization }) {
  if (type.isNone(organization)) {
    if (!type.isNone(caller)) {
      throw new Error(
        'system() names a "caller" without an "organization". A stand-in caller only runs inside an organization binding.'
      );
    }
    return;
  }
  if (!isNonEmptyString(organization)) {
    throw new Error(
      `system() requires "organization" to be a non-empty organization id string. Received ${JSON.stringify(
        organization
      )}.`
    );
  }
  if (
    !type.isNone(caller) &&
    (!type.isObject(caller) || !isNonEmptyString(caller.id) || !isNonEmptyString(caller.name))
  ) {
    throw new Error(
      `system() requires "caller" to be an object with non-empty string "id" and "name". Received ${JSON.stringify(
        caller
      )}.`
    );
  }
}

export default checkSystemBinding;
