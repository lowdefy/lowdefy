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

import { type } from '@lowdefy/helpers';

function createTypeDefinitions({ packageName, store, typeNames, typePrefix, version }) {
  if (type.isArray(typeNames)) {
    typeNames.forEach((typeName) => {
      store[`${typePrefix}${typeName}`] = {
        package: packageName,
        originalTypeName: typeName,
        version,
      };
    });
  }
}

function createPluginTypesMap({ packageName, packageTypes, typePrefix = '', typesMap, version }) {
  createTypeDefinitions({
    typeNames: packageTypes.actions,
    store: typesMap.actions,
    packageName,
    typePrefix,
    version,
  });

  createTypeDefinitions({
    typeNames: type.isObject(packageTypes.auth) ? packageTypes.auth.adapters : [],
    store: typesMap.auth.adapters,
    packageName,
    typePrefix,
    version,
  });

  createTypeDefinitions({
    typeNames: type.isObject(packageTypes.auth) ? packageTypes.auth.callbacks : [],
    store: typesMap.auth.callbacks,
    packageName,
    typePrefix,
    version,
  });

  createTypeDefinitions({
    typeNames: type.isObject(packageTypes.auth) ? packageTypes.auth.events : [],
    store: typesMap.auth.events,
    packageName,
    typePrefix,
    version,
  });

  createTypeDefinitions({
    typeNames: type.isObject(packageTypes.auth) ? packageTypes.auth.providers : [],
    store: typesMap.auth.providers,
    packageName,
    typePrefix,
    version,
  });

  createTypeDefinitions({
    typeNames: packageTypes.blocks,
    store: typesMap.blocks,
    packageName,
    typePrefix,
    version,
  });

  createTypeDefinitions({
    typeNames: packageTypes.connections,
    store: typesMap.connections,
    packageName,
    typePrefix,
    version,
  });

  createTypeDefinitions({
    typeNames: type.isObject(packageTypes.operators) ? packageTypes.operators.client : [],
    store: typesMap.operators.client,
    packageName,
    typePrefix,
    version,
  });

  createTypeDefinitions({
    typeNames: type.isObject(packageTypes.operators) ? packageTypes.operators.server : [],
    store: typesMap.operators.server,
    packageName,
    typePrefix,
    version,
  });

  createTypeDefinitions({
    typeNames: packageTypes.requests,
    store: typesMap.requests,
    packageName,
    typePrefix,
    version,
  });

  if (type.isObject(packageTypes.styles)) {
    Object.entries(packageTypes.styles).forEach(([blockType, styles]) => {
      if (blockType === 'default') {
        typesMap.styles.packages[packageName] = styles;
      } else {
        typesMap.styles.blocks[`${typePrefix}${blockType}`] = styles;
      }
    });
  }

  if (type.isObject(packageTypes.icons)) {
    Object.entries(packageTypes.icons).forEach(([blockType, icons]) => {
      typesMap.icons[`${typePrefix}${blockType}`] = icons;
    });
  }
}

export default createPluginTypesMap;
