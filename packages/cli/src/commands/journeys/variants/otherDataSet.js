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

import journeyUser from './journeyUser.js';

// The data set a data-set variant (empty, volume) runs on, by the flag that
// names it, with the journey's user found there by name. Returns
// { name, userName } or { skipped }.
function otherDataSet({ journey, dataSet, other, flag }) {
  if (type.isNone(other)) {
    return { skipped: `pass ${flag} <data set> to write it` };
  }
  const { name } = journeyUser({ journey, dataSet });
  if (type.isNull(name)) {
    return { skipped: "the journey's user is not a data set user name" };
  }
  if (!Object.prototype.hasOwnProperty.call(other.users, name)) {
    return { skipped: `data set "${other.name}" has no user "${name}"` };
  }
  return { name: other.name, userName: name };
}

export default otherDataSet;
