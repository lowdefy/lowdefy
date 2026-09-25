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

import createIconSemanticMap from './createIconSemanticMap.js';
import iconThemeDefaults from './iconThemeDefaults.js';
import loadIconSets from './loadIconSets.js';

// Everything resolveIconName needs: the layered sets, the default set, and
// the merged semantic map. The full build, the dev skeleton, dev JIT page
// builds and icon search all create it here, so they resolve alike.
async function createIconContext({ context, iconsConfig }) {
  const sets = await loadIconSets({ context });
  const defaultSet = iconsConfig?.set ?? iconThemeDefaults.set;
  const semantic = createIconSemanticMap({ sets, defaultSet, aliases: iconsConfig?.aliases });
  return { sets, defaultSet, semantic };
}

export default createIconContext;
