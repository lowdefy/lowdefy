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

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let tableCache = null;

// The react-icons to Lucide table `lowdefy upgrade` applies. The build reads
// the same file for its migration suggestions, so there is one source. Read
// only when an old name fails to resolve.
function readIconMigrationTable() {
  if (tableCache === null) {
    tableCache = require('@lowdefy/codemods/v7-0-0/react-icons-to-lucide.json');
  }
  return tableCache;
}

export default readIconMigrationTable;
