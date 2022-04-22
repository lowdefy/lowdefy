/*
  Copyright 2020-2022 Lowdefy, Inc

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

import path from 'path';
import { readFile, writeFile } from '@lowdefy/node-utils';

async function updateServerPackageJson({ components, context }) {
  const filePath = path.join(context.directories.server, 'package.json');
  const packageJsonContent = await readFile(filePath);
  const packageJson = JSON.parse(packageJsonContent);

  const dependencies = packageJson.dependencies;
  function getPackages(types) {
    Object.values(types).forEach((type) => {
      dependencies[type.package] = type.version;
    });
  }
  getPackages(components.types.actions);
  getPackages(components.types.auth.providers);
  getPackages(components.types.blocks);
  getPackages(components.types.connections);
  getPackages(components.types.requests);
  getPackages(components.types.operators.client);
  getPackages(components.types.operators.server);

  // Sort dependencies
  packageJson.dependencies = {};
  Object.keys(dependencies)
    .sort()
    .forEach((name) => {
      packageJson.dependencies[name] = dependencies[name];
    });

  const newPackageJsonContent = JSON.stringify(packageJson, null, 2).concat('\n');

  // Only write package.json if it has changed since dev server will
  // be watching the file to trigger reinstalls
  if (newPackageJsonContent !== packageJsonContent) {
    context.logger.warn('Plugin dependencies have changed. Updating "package.json".');
    await writeFile(filePath, newPackageJsonContent);
  }
}

export default updateServerPackageJson;
