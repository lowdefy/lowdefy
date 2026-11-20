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
import { assertMatches } from '@lowdefy/test-utils/assert';

function describeQuery({ collection, match }) {
  return `"${collection}" matching ${JSON.stringify(match)}`;
}

// What the documents an expect.db step found fail to show, or undefined when they hold what it
// expects, with the browser runner's messages: their count, or the list `equals`, item for item
// in _id order, each document holding at least the keys given.
function findDbMismatch({ documents, params }) {
  if (!type.isUndefined(params.count)) {
    if (documents.length === params.count) return undefined;
    return {
      message: `Expected ${params.count} document${
        params.count === 1 ? '' : 's'
      } in ${describeQuery(params)} but found ${documents.length}.`,
      expected: params.count,
      actual: documents.length,
    };
  }
  try {
    assertMatches(documents, params.equals);
    return undefined;
  } catch (error) {
    return {
      message: `Expected the documents in ${describeQuery(params)} to be ${JSON.stringify(
        params.equals
      )}: ${error.message}`,
      expected: params.equals,
      actual: documents,
    };
  }
}

export default findDbMismatch;
