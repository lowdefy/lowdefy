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

function describeUsers(dataSet) {
  const names = Object.keys(dataSet.users);
  return names.length === 0 ? 'It has no users.' : `Its users: ${names.join(', ')}.`;
}

// L5: the journey names who it runs as: a user from its data set, a list of
// them (one persona run each), or `none` for signed out. An inline user
// object, or no user, still runs, so it is a warning until the journey moves
// onto a data set. User names are read from the data set file (parseDataSet),
// so L5 needs no server. `dataSet` is null when the journey declares no data
// set or its data set could not be read (lintJourneys reports that itself). A
// list without data never reaches L5: validateJourney refuses it.
function L5({ journey, dataSet }) {
  const { user } = journey;
  if (type.isUndefined(user)) {
    return [
      {
        severity: 'warning',
        message:
          'has no user: name a user from its data set (or a list of them), or write user: none for signed out.',
      },
    ];
  }
  if (type.isObject(user)) {
    return [
      {
        severity: 'warning',
        message:
          'has an inline user object: add the user to its data set (tests/data/<name>.yaml) and name it.',
      },
    ];
  }
  if (user === 'none') {
    return [];
  }
  if (type.isNone(journey.data)) {
    return [
      {
        severity: 'warning',
        message: `names user "${user}" but declares no data: set to find it in.`,
      },
    ];
  }
  if (type.isNone(dataSet)) {
    return [];
  }
  const names = type.isArray(user) ? user : [user];
  return names
    .filter((name) => !Object.prototype.hasOwnProperty.call(dataSet.users, name))
    .map((name) => ({
      severity: 'warning',
      message: `names user "${name}", which data set "${
        dataSet.name
      }" does not have. ${describeUsers(dataSet)}`,
    }));
}

export default L5;
