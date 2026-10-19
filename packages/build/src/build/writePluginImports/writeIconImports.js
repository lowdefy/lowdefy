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

import generateIconEntries from '../icons/generateIconEntries.js';
import loadIconData from '../icons/loadIconData.js';

// plugins/icons.js is data: { name: IconData }, every icon the app bundles.
// Dev imports it; the production client loads it on demand, when a name that
// is not in the page's own set reaches an icon at runtime.
function generateIconsModule({ iconData }) {
  const { constants, entries } = generateIconEntries({ iconData });
  return [...constants, 'export default {', ...entries.map((entry) => `  ${entry}`), '};', ''].join(
    '\n'
  );
}

async function writeIconImports({ components, context }) {
  const iconData = await loadIconData({ names: components.imports.icons, icons: context.icons });
  await context.writeBuildArtifact('plugins/icons.js', generateIconsModule({ iconData }));
  // Server-only: the names plugins/icons.js carries. Dynamic content checks its
  // icons against them, and dev JIT delivers the names the dev bundle lacks.
  await context.writeBuildArtifact('iconImports.json', JSON.stringify(components.imports.icons));
  // The full semantic map (built-in, the default set's, and theme.icons.aliases),
  // used or not: the dev docs server's icon search lists it.
  await context.writeBuildArtifact('iconAliases.json', JSON.stringify(context.icons.semantic));
}

export default writeIconImports;
