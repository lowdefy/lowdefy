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

import readConnectionArtifacts from '../docs/dataSets/readConnectionArtifacts.js';
import resolveDataSetCollection from '../docs/dataSets/resolveDataSetCollection.js';

const defaultLimit = 5000;

function getSecretName({ dataSetName, connectionId, databaseUri }) {
  const markerless = type.isObject(databaseUri)
    ? Object.fromEntries(Object.entries(databaseUri).filter(([key]) => !key.startsWith('~')))
    : databaseUri;
  if (
    !type.isObject(markerless) ||
    Object.keys(markerless).length !== 1 ||
    !type.isString(markerless._secret)
  ) {
    throw new Error(
      `Data set "${dataSetName}" connection "${connectionId}": a pull reads only connections whose databaseUri is { _secret: NAME }, since the environment guard that proves which database it reads is keyed by secret name.`
    );
  }
  return markerless._secret;
}

// Exactly the connections snapshot.connections lists, with the per-connection overrides applied
// over the snapshot's defaults. Nothing unlisted is read.
async function resolvePullConnections({ buildDirectory, dataSet }) {
  const { snapshotSpec, name: dataSetName } = dataSet;
  const artifacts = await readConnectionArtifacts({ buildDirectory });
  const connections = snapshotSpec.connections.map((entry) => {
    const settings = type.isString(entry) ? { id: entry } : entry;
    const connectionId = settings.id;
    const artifact = artifacts[connectionId];
    const { collection, databaseName } = resolveDataSetCollection({
      dataSetName,
      connectionId,
      artifact,
    });
    let scope = settings.scope ?? snapshotSpec.scope ?? null;
    if (settings.scope === false) scope = null;
    return {
      connectionId,
      collection,
      databaseName,
      secretName: getSecretName({
        dataSetName,
        connectionId,
        databaseUri: artifact.properties.databaseUri,
      }),
      scope,
      limit: settings.limit ?? snapshotSpec.limit ?? defaultLimit,
      sort: settings.sort ?? { _id: -1 },
      omit: settings.omit ?? [],
    };
  });

  // Snapshot files are keyed by collection, so two listed connections naming one collection must
  // read the same database.
  const byCollection = {};
  connections.forEach((connection) => {
    const other = byCollection[connection.collection];
    if (
      !type.isUndefined(other) &&
      (other.secretName !== connection.secretName || other.databaseName !== connection.databaseName)
    ) {
      throw new Error(
        `Data set "${dataSetName}": connections "${other.connectionId}" and "${connection.connectionId}" both name collection "${connection.collection}" in different databases; list only one of them.`
      );
    }
    byCollection[connection.collection] = other ?? connection;
  });
  return connections;
}

export default resolvePullConnections;
