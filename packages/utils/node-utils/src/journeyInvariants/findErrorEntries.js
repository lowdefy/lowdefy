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

// The findings of the error entries a step's run caused: an entry the client reported is a
// client-error, and a fault the server logged is a server-error, or an environment finding when
// usesSearchStage(entry) says it came from a $search or $vectorSearch stage, which the data set's
// memory store cannot run. A server entry for a failure a test's fail gate forced (`forced`) is the
// test's doing, no finding, and neither is a fault a :catch of the routine handled (`caught`): the
// routine dealt with it and answered, so the journey judges the answer. Each entry is { message?,
// name?, source?, forced?, caught? }. Returns finding drafts for keyFindings.
function findErrorEntries({ clientEntries, serverEntries, usesSearchStage = () => false }) {
  return [
    ...clientEntries.map((entry) => ({
      kind: 'client-error',
      message: entry.message ?? entry.name,
      source: entry.source ?? null,
    })),
    ...serverEntries
      .filter((entry) => entry.forced !== true && entry.caught !== true)
      .map((entry) => ({
        kind: usesSearchStage(entry) ? 'environment' : 'server-error',
        message: entry.message ?? entry.name,
        source: entry.source ?? null,
      })),
  ];
}

export default findErrorEntries;
