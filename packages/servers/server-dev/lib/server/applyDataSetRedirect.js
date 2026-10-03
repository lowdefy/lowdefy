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

import createDataSetRefusal from './createDataSetRefusal.js';

// Module connections are written under their module's folder (connections/<module>/<id>.json), so
// the pattern matches every depth.
const connectionPathPattern = /^connections\/.+\.json$/;

// A top-level key starting with _ is an operator over the whole properties object, so what it
// evaluates to cannot be checked before it runs.
function hasLiteralKeys(properties) {
  return type.isObject(properties) && !Object.keys(properties).some((key) => key.startsWith('_'));
}

// The one gate for connections under a data session, for this request only. It fails closed: a
// connection is either verifiably pointed at the session's database or the read throws. A type
// declares how it behaves through meta.dataSet on its plugin: 'redirect' takes its database from
// databaseUri and databaseName, so the session's are merged over its properties whether or not the
// data set lists it; 'external' reaches an outside service and keeps its target; anything else,
// including no declaration, refuses. Returns a new artifact and never mutates the one it read, so it
// stays correct if reads are ever cached.
function applyDataSetRedirect({ context, session, connections }) {
  const readConfigFile = context.readConfigFile;
  context.readConfigFile = async function readConfigFileForDataSet(filePath) {
    const artifact = await readConfigFile(filePath);
    if (!connectionPathPattern.test(filePath) || type.isNone(artifact)) {
      return artifact;
    }
    // Work that outlived its session's drain fails loudly rather than reach any database.
    if (session.state === 'closed') {
      throw new Error(`Data session ${session.id} has ended.`);
    }
    const mode = connections[artifact.type]?.meta?.dataSet;
    if (mode === 'external') {
      return artifact;
    }
    if (mode !== 'redirect') {
      throw createDataSetRefusal({
        artifact,
        session,
        reason: 'its type does not say how to redirect it',
      });
    }
    if (!hasLiteralKeys(artifact.properties)) {
      throw createDataSetRefusal({
        artifact,
        session,
        reason: 'its properties are an operator, so the redirect cannot be checked',
      });
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
