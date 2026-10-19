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

import { ObjectId } from 'mongodb';
import { type } from '@lowdefy/helpers';

const OBJECT_ID_KEY = /^\{"_oid":"([0-9a-fA-F]{24})"\}$/;

// The `_id` of the array mode document, from the request config. It is matched exactly as
// given (a string stays a string), apart from the Table key text of an ObjectId.
function coerceDocumentId({ value }) {
  if (value instanceof ObjectId || type.isNumber(value)) return value;
  if (type.isString(value) && value !== '') {
    const match = OBJECT_ID_KEY.exec(value);
    return match === null ? value : ObjectId.createFromHexString(match[1]);
  }
  throw new Error(
    `MongoDBTableChanges "array.documentId" should be a string, number or ObjectId. Received ${JSON.stringify(
      value
    )}.`
  );
}

export default coerceDocumentId;
