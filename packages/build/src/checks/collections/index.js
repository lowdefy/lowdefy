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

import undeclared from './undeclared.js';
import dynamicCollection from './dynamicCollection.js';
import untenantedConnection from './untenantedConnection.js';
import fieldWithoutMigration from './fieldWithoutMigration.js';
import candidateIndexes from './indexes/candidateIndexes.js';

// Check-only rules over the collections: declaration (task 38), plus the
// collections/migrations correspondence (task 49, D11). All are silent when
// the app declares no collections: at all.
const collectionsRules = [
  undeclared,
  dynamicCollection,
  untenantedConnection,
  fieldWithoutMigration,
  candidateIndexes,
];

export default collectionsRules;
