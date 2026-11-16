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

import checkSessionOpen from './checkSessionOpen.js';
import describeTargetKey from './dataSets/describeTargetKey.js';
import sessionDatabaseName from './dataSets/sessionDatabaseName.js';

// The MongoDB driver's collection behind a connection, in the session database the connection's
// requests read and write: the database of the connection's own target, as the gate picks it
// (applyDataSetRedirect). It is the raw driver, past the tenant wall and every request type,
// so a test reads exactly what was stored, the tenant stamp included. Returned at once, not as
// a promise, so a test chains the driver's own call: session.collection(id).findOne(...).
function getSessionCollection({ connectionId, testSession }) {
  checkSessionOpen({ testSession });
  const artifacts = testSession.connectionArtifacts;
  const artifact = artifacts[connectionId];
  if (type.isNone(artifact)) {
    throw new Error(
      `Connection ${JSON.stringify(
        connectionId
      )} is not a connection in this app. Its connections are ${Object.keys(artifacts)
        .sort()
        .map((id) => `"${id}"`)
        .join(', ')}.`
    );
  }
  const collection = artifact.properties?.collection;
  if (artifact.type !== 'MongoDBCollection' || !type.isString(collection)) {
    throw new Error(
      `Connection "${connectionId}" (type ${artifact.type}) has no collection to read: only a MongoDBCollection connection whose collection is a literal string does.`
    );
  }
  const { session } = testSession.dataSession;
  const databaseName = sessionDatabaseName({
    session,
    target: describeTargetKey({ properties: artifact.properties }),
  });
  return testSession.store.client.db(databaseName).collection(collection);
}

export default getSessionCollection;
