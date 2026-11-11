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

import fs from 'fs';
import { CORE_SCHEMA, loadAll, mergeTag, timestampTag } from 'js-yaml';

// js-yaml 5 loads YAML 1.2 without merge keys and timestamps. Mock files were written for js-yaml
// 4, which merged `<<` keys and loaded unquoted dates as Date objects, so both are added back.
const MOCKS_SCHEMA = CORE_SCHEMA.withTags(mergeTag, timestampTag);

function loadStaticMocks(mocksFile) {
  if (!mocksFile || !fs.existsSync(mocksFile)) {
    return { requests: [], api: [] };
  }

  const content = fs.readFileSync(mocksFile, 'utf8');
  // loadAll, because js-yaml 5's load throws on a file with no document. An empty mocks file, or
  // one with only comments, declares no mocks.
  const documents = loadAll(content, { schema: MOCKS_SCHEMA });
  if (documents.length > 1) {
    throw new Error(
      `Mocks file "${mocksFile}" has ${documents.length} YAML documents. Put all mocks in one document.`
    );
  }
  const [parsed] = documents;

  return {
    requests: parsed?.requests ?? [],
    api: parsed?.api ?? [],
    user: parsed?.user ?? null,
  };
}

export default loadStaticMocks;
