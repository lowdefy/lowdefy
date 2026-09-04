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

import findFilePlugin from '../filePlugins/findFilePlugin.js';
import importPluginModule from './importPluginModule.js';

async function writeActionSchemaMap({ components, context }) {
  const schemas = {};

  const typesMapSchemas = context.typesMap.schemas?.actions ?? {};

  const actionsByPackage = {};
  for (const action of components.imports.actions) {
    // A file plugin has no package barrel to import a schema from: the schema
    // is the "schema" key of the sibling JSON discovery read.
    if (type.isNone(action.package)) {
      const record = findFilePlugin({ context, kind: 'actions', typeName: action.typeName });
      if (!type.isNone(record?.schema)) {
        schemas[action.typeName] = record.schema;
      }
      continue;
    }
    if (!actionsByPackage[action.package]) {
      actionsByPackage[action.package] = [];
    }
    actionsByPackage[action.package].push(action);
  }

  for (const [packageName, actions] of Object.entries(actionsByPackage)) {
    const packageSchemas = await importPluginModule({
      context,
      specifier: `${packageName}/schemas`,
    });
    for (const action of actions) {
      if (typesMapSchemas[action.typeName]) {
        schemas[action.typeName] = typesMapSchemas[action.typeName];
      } else if (packageSchemas?.[action.originalTypeName]) {
        schemas[action.typeName] = packageSchemas[action.originalTypeName];
      }
    }
  }

  return context.writeBuildArtifact('plugins/actionSchemas.json', JSON.stringify(schemas));
}

export default writeActionSchemaMap;
