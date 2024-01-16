/*
  Copyright 2020-2024 Lowdefy, Inc

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

const getBlockMatcher = (params) => {
  let testParams = params;
  if (type.isNone(testParams)) return () => true;
  if (type.isString(testParams)) {
    testParams = { blockIds: [testParams] };
  }
  if (type.isArray(testParams) || type.isBoolean(testParams)) {
    testParams = { blockIds: testParams };
  }
  if (!type.isObject(testParams)) {
    throw new Error('Invalid validate params.');
  }
  if (type.isString(testParams.blockIds)) {
    testParams.blockIds = [testParams.blockIds];
  }
  if (type.isString(testParams.regex)) {
    testParams.regex = [testParams.regex];
  }
  if (type.isArray(testParams.regex)) {
    testParams.regex = testParams.regex.map((regex) => new RegExp(regex));
  }
  return (id) => {
    if (
      testParams.blockIds === true ||
      (type.isArray(testParams.blockIds) && testParams.blockIds.includes(id))
    ) {
      return true;
    }
    if (type.isArray(testParams.regex)) {
      for (const regex of testParams.regex) {
        if (regex.test(id)) {
          return true;
        }
      }
    }
    return false;
  };
};

export default getBlockMatcher;
