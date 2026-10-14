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

import loadPluginTypeSchema from './loadPluginTypeSchema.js';

async function writeActionSchemaMap({ components, context }) {
  const schemas = {};

  for (const action of components.imports.actions) {
    const { schema } = await loadPluginTypeSchema({ context, kind: 'actions', type: action });
    if (schema) {
      schemas[action.typeName] = schema;
    }
  }

  return context.writeBuildArtifact('plugins/actionSchemas.json', JSON.stringify(schemas));
}

export default writeActionSchemaMap;
