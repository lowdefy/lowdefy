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

import { mergeObjects, type } from '@lowdefy/helpers';

// Module connections are written under their module's folder (connections/<module>/<id>.json), so
// the pattern matches every depth.
const connectionPathPattern = /^connections\/.+\.json$/;

// Points every connection that carries a databaseUri at the data session's database, for this
// request only: whatever its type (a plugin connection that opens its own MongoClient from
// databaseUri is reached the same way) and whether or not the data set lists it, so a journey never
// writes to a real database because a connection was left off a list. Returns a new artifact and
// never mutates the one it read, so it stays correct if reads are ever cached.
function applyDataSetRedirect({ context, session }) {
  const readConfigFile = context.readConfigFile;
  context.readConfigFile = async function readConfigFileForDataSet(filePath) {
    const artifact = await readConfigFile(filePath);
    if (!connectionPathPattern.test(filePath) || type.isNone(artifact)) {
      return artifact;
    }
    if (type.isNone(artifact.properties?.databaseUri)) {
      return artifact;
    }
    // Work that outlived its session's drain fails loudly rather than reach any database.
    if (session.state === 'closed') {
      throw new Error(`Data session ${session.id} has ended.`);
    }
    return {
      ...artifact,
      properties: mergeObjects([
        artifact.properties,
        { databaseUri: session.databaseUri, databaseName: session.databaseName },
      ]),
    };
  };
}

export default applyDataSetRedirect;
