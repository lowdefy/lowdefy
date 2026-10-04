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

// Who the journey runs as: { name, user }. name is the data set user's name
// when the journey names one, else null; user is that user, or the journey's
// inline user object, or null when it runs signed out.
function journeyUser({ journey, dataSet }) {
  const { user } = journey;
  if (type.isObject(user)) {
    return { name: null, user };
  }
  if (
    type.isString(user) &&
    user !== 'none' &&
    !type.isNone(dataSet) &&
    Object.prototype.hasOwnProperty.call(dataSet.users, user)
  ) {
    return { name: user, user: dataSet.users[user] };
  }
  return { name: null, user: null };
}

export default journeyUser;
