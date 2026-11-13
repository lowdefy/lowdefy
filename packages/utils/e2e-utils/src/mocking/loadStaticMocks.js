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
import YAML from 'yaml';

// Mock files were written for js-yaml 4, which merged `<<` keys and loaded unquoted dates as Date
// objects. The yaml package's default YAML 1.2 core schema does neither, so both are turned on.
const MOCKS_OPTIONS = { merge: true, customTags: ['timestamp'] };

function loadStaticMocks(mocksFile) {
  if (!mocksFile || !fs.existsSync(mocksFile)) {
    return { requests: [], api: [] };
  }

  const content = fs.readFileSync(mocksFile, 'utf8');
  // parseAllDocuments, to name the mocks file when it has more than one document. An empty mocks
  // file, or one with only comments, has none and declares no mocks.
  const documents = YAML.parseAllDocuments(content, MOCKS_OPTIONS);
  if (documents.length > 1) {
    throw new Error(
      `Mocks file "${mocksFile}" has ${documents.length} YAML documents. Put all mocks in one document.`
    );
  }
  const [document] = documents;
  if (document?.errors.length > 0) {
    throw document.errors[0];
  }
  const parsed = document?.toJS();

  return {
    requests: parsed?.requests ?? [],
    api: parsed?.api ?? [],
    user: parsed?.user ?? null,
  };
}

export default loadStaticMocks;
