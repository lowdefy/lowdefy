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

import listDatabaseTargets from './listDatabaseTargets.js';
import readConnectionArtifacts from './readConnectionArtifacts.js';

// The data set of a data session that names none: no documents, indexes or users, and a
// database for every database target the build names, as a named data set gets (readDataSet).
// `name` is what a connection refusal calls the session.
async function readEmptyDataSet({ buildDirectory, name }) {
  const artifacts = await readConnectionArtifacts({ buildDirectory });
  return {
    name,
    fixtures: {},
    generated: {},
    indexes: {},
    users: {},
    collections: {},
    targets: {},
    databaseTargets: listDatabaseTargets({ artifacts }),
  };
}

export default readEmptyDataSet;
