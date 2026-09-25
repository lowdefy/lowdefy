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

import extractIconData from './extractIconData.js';
import writeIconsDynamic from './writeIconsDynamic.js';

async function updateIconImportsJit({ newIcons, iconImports, context }) {
  for (const { alias, icon, package: pkg } of newIcons) {
    // A semantic name is delivered as its own key; its target is not added to
    // the bundled imports snapshot.
    if (alias) continue;
    let entry = iconImports.find((e) => e.package === pkg);
    if (!entry) {
      entry = { icons: [], package: pkg };
      iconImports.push(entry);
    }
    // Guard against concurrent JIT builds adding the same icon
    if (!entry.icons.includes(icon)) {
      entry.icons.push(icon);
    }
  }

  await context.writeBuildArtifact('iconImports.json', JSON.stringify(iconImports));

  // Extract SVG tree data from react-icons and write a self-contained JS module
  // that the client can fetch at runtime without a Next.js rebuild.
  const iconData = extractIconData({
    icons: newIcons.map(({ icon, package: pkg }) => ({ icon, package: pkg })),
    directories: context.directories,
    logger: context.logger,
  });
  const newIconData = {};
  newIcons.forEach(({ alias, icon }) => {
    if (iconData[icon]) {
      newIconData[alias ?? icon] = iconData[icon];
    }
  });
  await writeIconsDynamic({ newIconData, context });
}

export default updateIconImportsJit;
