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

const PROPERTY_NAME = /^[A-Za-z_][A-Za-z0-9_$]*$/;

// Person property names go into the query text (HogQL placeholders hold
// values, not names), so only plain identifiers are accepted.
function checkPropertyName({ flag, name }) {
  if (!type.isString(name) || !PROPERTY_NAME.test(name)) {
    throw new Error(
      `${flag} should be a person property name of letters, digits, _ and $, starting with a letter or _. Received ${JSON.stringify(
        name
      )}.`
    );
  }
}

export default checkPropertyName;
