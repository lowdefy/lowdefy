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

import { buildBlockSchema } from '@lowdefy/block-utils';

import createEmptyTypesMap from './createEmptyTypesMap.js';
import createPluginTypesMap from './createPluginTypesMap.js';
import getPackageVersion from './getPackageVersion.js';
import importPluginModule from '../build/writePluginImports/importPluginModule.js';

// Default packages resolve from the build package itself, so no server
// directory is needed.
function importModule(specifier) {
  return importPluginModule({ context: {}, specifier });
}

// A block's meta is read as loadPluginTypeSchema reads it: `./metas`, else `./schemas`.
async function importBlockMetas(packageName) {
  return (
    (await importModule(`${packageName}/metas`)) ?? (await importModule(`${packageName}/schemas`))
  );
}

async function addPackageSchemas({ packageName, schemas, types }) {
  const operatorTypes = [...(types.operators?.client ?? []), ...(types.operators?.server ?? [])];
  if ((types.actions ?? []).length > 0 || operatorTypes.length > 0) {
    const packageSchemas = await importModule(`${packageName}/schemas`);
    (types.actions ?? []).forEach((typeName) => {
      if (packageSchemas?.[typeName]) {
        schemas.actions[typeName] = { package: packageName, schema: packageSchemas[typeName] };
      }
    });
    operatorTypes.forEach((typeName) => {
      if (packageSchemas?.[typeName]) {
        schemas.operators[typeName] = { package: packageName, schema: packageSchemas[typeName] };
      }
    });
  }
  if ((types.blocks ?? []).length > 0) {
    const metas = await importBlockMetas(packageName);
    types.blocks.forEach((typeName) => {
      const meta = metas?.[typeName];
      if (!meta) return;
      // hazards is the one field writeBlockSchemaMap reads from a block's own
      // meta; the types map's blockMetas (extractBlockTypes) do not carry it.
      schemas.blocks[typeName] = {
        package: packageName,
        schema: buildBlockSchema(meta),
        hazards: meta.hazards,
      };
    });
  }
}

// Whether the package exports `./checks`. A default package with rules must be
// a dependency of @lowdefy/build, so it is installed wherever the build runs
// and a default package never has to be installed for its checks to run.
async function packageHasChecks({ packageFile, packageName }) {
  const checks = await importModule(`${packageName}/checks`);
  if (checks === undefined) {
    return false;
  }
  if (!packageFile.dependencies?.[packageName]) {
    throw new Error(
      `Default plugin package ${packageName} exports ./checks but is not in the dependencies of @lowdefy/build. Add it there, so its rules load wherever the build runs.`
    );
  }
  return true;
}

// The types of the default plugin packages, with the schemas the build checks
// config against and writes to plugins/*Schemas.json, so a default package
// never has to be installed for its checks to run:
// - schemas.{actions,blocks,operators}[typeName]: { package, schema }, a
//   block's also with its meta's hazards;
// - hasChecks[packageName]: whether the package exports ./checks.
async function createDefaultTypesMap({ packageFile, packageNames }) {
  const typesMap = createEmptyTypesMap();
  typesMap.schemas = { actions: {}, blocks: {}, operators: {} };
  typesMap.hasChecks = {};

  for (const packageName of packageNames) {
    const { default: types } = await import(`${packageName}/types`);
    createPluginTypesMap({
      packageTypes: types,
      typesMap,
      packageName,
      version: getPackageVersion({ packageFile, packageName }),
    });
    await addPackageSchemas({ packageName, schemas: typesMap.schemas, types });
    typesMap.hasChecks[packageName] = await packageHasChecks({ packageFile, packageName });
  }
  return typesMap;
}

export default createDefaultTypesMap;
