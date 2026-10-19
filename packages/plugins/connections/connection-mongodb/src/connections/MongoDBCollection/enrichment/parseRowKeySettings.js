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

import isSafePath from '../MongoDBTableChanges/isSafePath.js';

const rowKeyTypes = ['auto', 'objectId', 'string', 'number'];

// The row key settings shared by the enrichment requests, read like MongoDBTableChanges reads
// them: `rowKeyField` a safe dot path (default `_id`), `rowKeyType` one of the key readers.
function parseRowKeySettings({ properties, requestType }) {
  const rowKeyField = properties.rowKeyField ?? '_id';
  const rowKeyType = properties.rowKeyType ?? 'auto';
  if (!isSafePath(rowKeyField)) {
    throw new Error(
      `${requestType} "rowKeyField" should be a dot path whose segments are not empty and do not start with "$". Received ${JSON.stringify(
        rowKeyField
      )}.`
    );
  }
  if (!rowKeyTypes.includes(rowKeyType)) {
    throw new Error(
      `${requestType} "rowKeyType" should be one of ${JSON.stringify(
        rowKeyTypes
      )}. Received ${JSON.stringify(rowKeyType)}.`
    );
  }
  return { rowKeyField, rowKeyType };
}

export default parseRowKeySettings;
