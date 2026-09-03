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

import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';
import importPluginModule from './importPluginModule.js';
import validateHazardsShape from './validateHazardsShape.js';

// Connection and request schemas live as statics on the connection classes
// (Connection.schema, Connection.requests[Request].schema), not behind a
// package /schemas export. Collect them here, in the build process, so the
// dev server can serve schemas for every installed connection package without
// importing heavy connection dependencies (database drivers etc.) at runtime.
// Dev-only — context.installedPackages is set by the dev shallow build
// (addInstalledTypes); production builds skip it.
async function writeConnectionSchemaMap({ context }) {
  const { installedPackages } = context;
  if (!installedPackages) {
    return;
  }
  const connectionSchemas = {};
  const requestSchemas = {};

  const typesMapConnectionSchemas = context.typesMap.schemas?.connections ?? {};
  const typesMapRequestSchemas = context.typesMap.schemas?.requests ?? {};

  const connectionsByPackage = {};
  for (const [typeName, definition] of Object.entries(context.typesMap.connections ?? {})) {
    if (!installedPackages.has(definition.package)) {
      continue;
    }
    if (!connectionsByPackage[definition.package]) {
      connectionsByPackage[definition.package] = [];
    }
    connectionsByPackage[definition.package].push({ typeName, ...definition });
  }

  const requestsByPackage = {};
  for (const [typeName, definition] of Object.entries(context.typesMap.requests ?? {})) {
    if (!installedPackages.has(definition.package)) {
      continue;
    }
    if (!requestsByPackage[definition.package]) {
      requestsByPackage[definition.package] = [];
    }
    requestsByPackage[definition.package].push({ typeName, ...definition });
  }

  const packageNames = new Set([
    ...Object.keys(connectionsByPackage),
    ...Object.keys(requestsByPackage),
  ]);

  for (const packageName of packageNames) {
    const packageConnections = await importPluginModule({
      context,
      specifier: `${packageName}/connections`,
    });

    const requestFnsByOriginalName = {};
    for (const connection of Object.values(packageConnections ?? {})) {
      for (const [requestName, requestFn] of Object.entries(connection?.requests ?? {})) {
        requestFnsByOriginalName[requestName] = requestFn;
      }
    }

    for (const connection of connectionsByPackage[packageName] ?? []) {
      const originalTypeName = connection.originalTypeName ?? connection.typeName;
      const implementation = packageConnections?.[originalTypeName];
      const typePrefix = connection.typeName.slice(
        0,
        connection.typeName.length - originalTypeName.length
      );
      if (typesMapConnectionSchemas[connection.typeName]) {
        connectionSchemas[connection.typeName] = typesMapConnectionSchemas[connection.typeName];
      } else if (implementation?.schema) {
        connectionSchemas[connection.typeName] = {
          schema: implementation.schema,
          requests: Object.keys(implementation.requests ?? {}).map(
            (requestName) => `${typePrefix}${requestName}`
          ),
        };
      }
    }

    for (const request of requestsByPackage[packageName] ?? []) {
      const requestFn = requestFnsByOriginalName[request.originalTypeName ?? request.typeName];
      if (typesMapRequestSchemas[request.typeName]) {
        requestSchemas[request.typeName] = typesMapRequestSchemas[request.typeName];
      } else if (requestFn?.schema) {
        const hazardsProblem = validateHazardsShape(requestFn.meta?.hazards);
        if (hazardsProblem !== null) {
          collectExceptions(
            context,
            new ConfigError(
              `Request "${request.typeName}" from package "${packageName}": meta.${hazardsProblem}`,
              { received: requestFn.meta.hazards }
            )
          );
        }
        requestSchemas[request.typeName] = {
          schema: requestFn.schema,
          meta: requestFn.meta ?? {},
        };
      }
    }
  }

  await context.writeBuildArtifact(
    'plugins/connectionSchemas.json',
    JSON.stringify(connectionSchemas)
  );
  await context.writeBuildArtifact('plugins/requestSchemas.json', JSON.stringify(requestSchemas));
}

export default writeConnectionSchemaMap;
