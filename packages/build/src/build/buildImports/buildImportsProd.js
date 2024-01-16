/*
  Copyright 2020-2024 Lowdefy, Inc

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

import buildIconImports from './buildIconImports.js';
import buildStyleImports from './buildStyleImports.js';
import defaultIconsProd from './defaultIconsProd.js';

function buildImportClassProd(types) {
  return Object.entries(types).map(([typeName, type]) => ({
    originalTypeName: type.originalTypeName,
    package: type.package,
    typeName,
  }));
}

function buildImportsProd({ components, context }) {
  const blocks = buildImportClassProd(components.types.blocks);
  return {
    actions: buildImportClassProd(components.types.actions),
    auth: {
      adapters: buildImportClassProd(components.types.auth.adapters),
      callbacks: buildImportClassProd(components.types.auth.callbacks),
      events: buildImportClassProd(components.types.auth.events),
      providers: buildImportClassProd(components.types.auth.providers),
    },
    blocks,
    connections: buildImportClassProd(components.types.connections),
    icons: buildIconImports({ blocks, components, context, defaults: defaultIconsProd }),
    requests: buildImportClassProd(components.types.requests),
    operators: {
      client: buildImportClassProd(components.types.operators.client),
      server: buildImportClassProd(components.types.operators.server),
    },
    styles: buildStyleImports({ blocks, context }),
  };
}

export default buildImportsProd;
