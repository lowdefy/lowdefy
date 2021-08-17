/*
  Copyright 2020-2021 Lowdefy, Inc

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

const getMatch = (params) => (id) => {
  if (params.blockIds === true || (type.isArray(params.blockIds) && params.blockIds.includes(id))) {
    return true;
  }
  if (type.isArray(params.regex)) {
    for (const regex of params.regex) {
      if (regex.test(id)) {
        return true;
      }
    }
  }
  return false;
};

async function Validate({ context, params }) {
  let testParams = params;
  if (type.isNone(testParams)) {
    testParams = { blockIds: true };
  }
  if (type.isString(testParams)) {
    testParams = { blockIds: [testParams] };
  }
  if (type.isArray(testParams)) {
    testParams = { blockIds: testParams };
  }
  if (!type.isObject(testParams)) {
    throw new Error('Invalid validate params.');
  }
  if (type.isString(testParams.regex)) {
    testParams.regex = [testParams.regex];
  }
  if (type.isArray(testParams.regex)) {
    testParams.regex = testParams.regex.map((regex) => new RegExp(regex));
  }
  const validationErrors = context.RootBlocks.validate(testParams, getMatch(testParams));
  if (validationErrors.length > 0) {
    const error = new Error(
      `Your input has ${validationErrors.length} validation error${
        validationErrors.length !== 1 ? 's' : ''
      }.`
    );
    throw error;
  }
}

export default Validate;
