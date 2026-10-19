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
import isSafePath from './isSafePath.js';
import notInFieldsError from './notInFieldsError.js';

// The allowlist entry for a changeset key. The "$" check comes first so an injection attempt
// ("$where", "items.$[x]") gets an error that says what it is, not just "not in fields".
function getChangeField({ fieldsByKey, key, location }) {
  if (!isSafePath(key)) {
    throw new Error(
      `MongoDBTableChanges ${location}: key ${JSON.stringify(
        key
      )} is not allowed. Changes can not name MongoDB operators or positional paths.`
    );
  }
  const field = fieldsByKey.get(key);
  if (field === undefined) {
    throw notInFieldsError({ fieldsByKey, key, location });
  }
  return field;
}

export default getChangeField;
