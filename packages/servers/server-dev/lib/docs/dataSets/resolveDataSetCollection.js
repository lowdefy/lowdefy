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

// A data set loads a connection only when the built artifact names its
// collection: an operator there is evaluated per request, so the collection cannot be known before
// one. Returns the literal collection and databaseName (or undefined).
function resolveDataSetCollection({ dataSetName, connectionId, artifact }) {
  const where = `Data set "${dataSetName}" connection "${connectionId}"`;
  if (type.isNone(artifact)) {
    throw new Error(`${where} is not a connection in this app.`);
  }
  if (artifact.type !== 'MongoDBCollection') {
    throw new Error(
      `${where} is a ${artifact.type} connection; data sets load MongoDBCollection connections only.`
    );
  }
  const { collection, databaseName } = artifact.properties ?? {};
  if (!type.isString(collection)) {
    throw new Error(
      `${where} has a computed "collection"; a data set can only load a connection whose collection is a literal string.`
    );
  }
  if (!type.isUndefined(databaseName) && !type.isString(databaseName)) {
    throw new Error(
      `${where} has a computed "databaseName"; a data set can only load a connection whose databaseName is a literal string or not set.`
    );
  }
  return { collection, databaseName };
}

export default resolveDataSetCollection;
