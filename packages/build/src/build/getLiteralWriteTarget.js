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

// The literal collection an aggregation stage writes into with $out or $merge,
// or null. A target named by an operator, or in another database
// ({ db, coll }), can not be resolved at build and returns null.
function getLiteralWriteTarget(stage) {
  if (!type.isObject(stage)) {
    return null;
  }
  if (type.isString(stage.$out)) {
    return { operator: '$out', collection: stage.$out };
  }
  if (type.isString(stage.$merge)) {
    return { operator: '$merge', collection: stage.$merge };
  }
  if (type.isString(stage.$merge?.into)) {
    return { operator: '$merge', collection: stage.$merge.into };
  }
  return null;
}

export default getLiteralWriteTarget;
