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

import describeTargetKey from './describeTargetKey.js';
import readConnectionArtifacts from './readConnectionArtifacts.js';
import sessionDatabaseName from './sessionDatabaseName.js';

function listMongoConnectionIds({ artifacts }) {
  return Object.values(artifacts)
    .filter((artifact) => artifact.type === 'MongoDBCollection')
    .map((artifact) => artifact.connectionId)
    .sort();
}

// The session database a journey's expect.db reads: the database of the named connection's target,
// as its requests write it (applyDataSetRedirect), or, with no connectionId, the session's one
// database. A session with several databases needs the connectionId to say which.
async function findDatabaseName({ buildDirectory, connectionId, session }) {
  const artifacts = await readConnectionArtifacts({ buildDirectory });
  if (type.isUndefined(connectionId)) {
    if (session.databases.size > 1) {
      throw new Error(
        `The app's connections write to ${
          session.databases.size
        } databases: name the "connectionId" whose database to read, one of ${listMongoConnectionIds(
          { artifacts }
        )
          .map((id) => `"${id}"`)
          .join(', ')}.`
      );
    }
    return session.databaseName;
  }
  const artifact = artifacts[connectionId];
  if (type.isUndefined(artifact) || artifact.type !== 'MongoDBCollection') {
    throw new Error(
      `Connection "${connectionId}" is not a MongoDBCollection connection of this app. Its MongoDBCollection connections are ${listMongoConnectionIds(
        { artifacts }
      )
        .map((id) => `"${id}"`)
        .join(', ')}.`
    );
  }
  return sessionDatabaseName({
    session,
    target: describeTargetKey({ properties: artifact.properties }),
  });
}

// The documents `match` finds in `collection` of a data session's database, in _id order, as
// plain JSON values (an ObjectId as its hex string, a Date as its ISO string), so a journey's
// expect.db compares them with the values its YAML can hold. `client` is the data store's
// MongoDB client and `session` the data session (openDataSession's session).
async function findSessionDocuments({
  buildDirectory,
  client,
  collection,
  connectionId,
  match,
  session,
}) {
  const databaseName = await findDatabaseName({ buildDirectory, connectionId, session });
  const documents = await client
    .db(databaseName)
    .collection(collection)
    .find(match)
    .sort({ _id: 1 })
    .toArray();
  return JSON.parse(JSON.stringify(documents));
}

export default findSessionDocuments;
