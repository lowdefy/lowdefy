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

import path from 'path';
import { type } from '@lowdefy/helpers';
import { readFile, writeFile } from '@lowdefy/node-utils';

async function updateServerPackageJson({ components, context }) {
  const filePath = path.join(context.directories.server, 'package.json');
  const packageJsonContent = await readFile(filePath);
  const packageJson = JSON.parse(packageJsonContent);

  const dependencies = packageJson.dependencies;
  function getPackages(types) {
    Object.values(types).forEach((pluginType) => {
      // A file plugin is a file in the app, not a package: it carries
      // package: null and there is nothing to install for it. Writing it here
      // would add a dependency literally named "null" with a null version,
      // which the package manager rejects.
      if (type.isNone(pluginType.package)) {
        return;
      }
      // Deployment tooling may have rewritten a workspace plugin to a link:
      // path — overwriting it with the configured version (e.g. workspace:*)
      // would break installs outside the monorepo workspace.
      if (dependencies[pluginType.package]?.startsWith('link:')) {
        return;
      }
      dependencies[pluginType.package] = pluginType.version;
    });
  }
  getPackages(components.types.actions);
  getPackages(components.types.agents);
  getPackages(components.types.auth.adapters);
  getPackages(components.types.auth.providers);
  getPackages(components.types.auth.strategies);
  getPackages(components.types.blocks);
  getPackages(components.types.connections);
  getPackages(components.types.notifications);
  getPackages(components.types.requests);
  getPackages(components.types.websockets);
  getPackages(components.types.operators.client);
  getPackages(components.types.operators.server);

  if ((components.notifications ?? []).length > 0) {
    // plugins/notifications.js re-exports renderEmail from @lowdefy/email-templates
    // for every app with notifications — including apps that only use custom
    // template types, where no framework template appears in components.types.
    // The react-email preview CLI is deliberately NOT added here — it is a
    // dev-only tool the `lowdefy emails` command installs just-in-time, so
    // production servers never carry it.
    const emailTemplates = Object.values(context.typesMap.notifications ?? {}).find(
      (t) => t.package === '@lowdefy/email-templates'
    );
    if (emailTemplates && !dependencies['@lowdefy/email-templates']?.startsWith('link:')) {
      dependencies['@lowdefy/email-templates'] = emailTemplates.version;
    }
  }

  // Sort dependencies
  packageJson.dependencies = {};
  Object.keys(dependencies)
    .sort()
    .forEach((name) => {
      packageJson.dependencies[name] = dependencies[name];
    });

  const newPackageJsonContent = JSON.stringify(packageJson, null, 2).concat('\n');

  await writeFile(filePath, newPackageJsonContent);
}

export default updateServerPackageJson;
