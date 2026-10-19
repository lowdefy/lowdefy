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

const SHAPE =
  'Journey "user" should be an inline user object, e.g. {roles: [admin]}, "none" to sign in through the app, the name of a user in the journey\'s data set, or a list of such names to run the journey once as each.';

// Who a journey runs as: an inline user object, "none" (signed out), the name
// of a data set user, or a list of data set user names. A list runs the
// journey once per user (a persona run each), so it holds names only and
// needs the data set the names are read from. Returns { error } or {}.
function validateJourneyUser({ user, data }) {
  if (type.isUndefined(user) || type.isObject(user)) {
    return {};
  }
  if (type.isString(user)) {
    return user === '' ? { error: SHAPE } : {};
  }
  if (!type.isArray(user)) {
    return { error: `${SHAPE} Received ${JSON.stringify(user)}.` };
  }
  if (user.length === 0) {
    return {
      error: 'Journey "user" is an empty list. Name at least one data set user, e.g. [admin].',
    };
  }
  const invalid = user.find((name) => !type.isString(name) || name === '' || name === 'none');
  if (!type.isUndefined(invalid)) {
    return {
      error: `Journey "user" list should hold data set user names only; "none" and inline user objects stay single values. Received ${JSON.stringify(
        invalid
      )}.`,
    };
  }
  const duplicate = user.find((name, index) => user.indexOf(name) !== index);
  if (!type.isUndefined(duplicate)) {
    return { error: `Journey "user" list names "${duplicate}" more than once.` };
  }
  if (type.isNone(data)) {
    return {
      error:
        'Journey "user" is a list of data set users, but the journey declares no "data": set "data" to the data set (tests/data/<name>.yaml) the users are in.',
    };
  }
  return {};
}

export default validateJourneyUser;
