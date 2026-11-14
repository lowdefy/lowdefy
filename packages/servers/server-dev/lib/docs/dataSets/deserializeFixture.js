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

import { Decimal128, ObjectId } from 'mongodb';
import { serializer, type } from '@lowdefy/helpers';

function reviver(_, value) {
  if (!type.isObject(value)) {
    return value;
  }
  if (type.isString(value._oid)) {
    return ObjectId.createFromHexString(value._oid);
  }
  if (!type.isUndefined(value._decimal)) {
    if (!type.isString(value._decimal)) {
      throw new Error(
        `A fixture decimal is a string, such as { _decimal: '12.50' }. Received ${JSON.stringify(
          value._decimal
        )}.`
      );
    }
    return Decimal128.fromString(value._decimal);
  }
  return value;
}

// A fixture document as the database stores it: `~d` markers become Dates (the serializer),
// { _oid: '<hex>' } becomes an ObjectId and { _decimal: '<string>' } a Decimal128, the conventions
// connection-mongodb's serialize.js uses for request payloads.
function deserializeFixture(document) {
  return serializer.copy(document, { reviver });
}

export default deserializeFixture;
