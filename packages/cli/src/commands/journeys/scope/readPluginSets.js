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

import getLowdefyYaml from '../../../utils/getLowdefyYaml.js';

// The base is built with the plugins the head installs. A plugin only the
// base lists cannot load, so the base build fails; a plugin whose version
// differs is built at the head's version, so changes to its types do not show
// in the diff. Both are recorded in scope.json and printed.
async function readPluginSets({ baseConfigDirectory, headConfigDirectory }) {
  const [{ plugins: basePlugins }, { plugins: headPlugins }] = await Promise.all([
    getLowdefyYaml({ configDirectory: baseConfigDirectory, requiresLowdefyYaml: true }),
    getLowdefyYaml({ configDirectory: headConfigDirectory, requiresLowdefyYaml: true }),
  ]);
  const headVersions = new Map(headPlugins.map((plugin) => [plugin.name, plugin.version]));
  const missingFromHead = [];
  const versionChanged = [];
  basePlugins.forEach((plugin) => {
    if (!headVersions.has(plugin.name)) {
      missingFromHead.push(plugin.name);
      return;
    }
    const headVersion = headVersions.get(plugin.name);
    if (headVersion !== plugin.version) {
      versionChanged.push({ name: plugin.name, base: plugin.version, head: headVersion });
    }
  });
  return { missingFromHead, versionChanged };
}

export default readPluginSets;
