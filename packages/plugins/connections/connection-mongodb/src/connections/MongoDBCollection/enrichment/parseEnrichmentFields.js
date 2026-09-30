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

import normalizeFields from '../MongoDBTableQuery/normalizeFields.js';

// The table's MongoDBTableQuery `fields`, keyed by column key: the allowlist of fields that
// enrichment inputs may read and that claimed rows return.
function parseEnrichmentFields({ fields, requestType }) {
  if (!type.isObject(fields) || Object.keys(fields).length === 0) {
    throw new Error(
      `${requestType} requires "fields", the MongoDBTableQuery fields of the table, keyed by column key. Received ${JSON.stringify(
        fields
      )}.`
    );
  }
  return normalizeFields({ fields });
}

export default parseEnrichmentFields;
