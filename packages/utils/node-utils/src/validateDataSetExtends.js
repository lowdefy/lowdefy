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

import dataSetNamePattern from './dataSetNamePattern.js';

function validateDataSetExtends({ extends: names, fail }) {
  if (type.isNone(names)) return [];
  if (!type.isArray(names)) {
    fail(
      `"extends" should be a list of data set names, e.g. extends: [base]. Received ${JSON.stringify(
        names
      )}.`
    );
  }
  names.forEach((name, index) => {
    if (!type.isString(name) || !dataSetNamePattern.test(name)) {
      fail(
        `extends[${index}] ${JSON.stringify(
          name
        )} is not a data set name. Use lowercase letters, digits, "-" and "_".`
      );
    }
    if (names.indexOf(name) !== index) {
      fail(`extends names "${name}" twice.`);
    }
  });
  return names;
}

export default validateDataSetExtends;
