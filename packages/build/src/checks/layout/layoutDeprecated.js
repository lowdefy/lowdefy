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

import { ConfigWarning, resolveConfigLocation } from '@lowdefy/errors';

import collectLayoutSites from './collectLayoutSites.js';
import describeLayoutSite from './describeLayoutSite.js';

// R22: per-block layout: is deprecated in favour of the Row, Grid and Stack
// container blocks, not removed. Removal is a v9 decision taken on what these
// numbers say, so this rule's job is to count and to name the wrapper each
// site needs — never to fail a build. It is check-only for the same reason:
// an app that never runs `lowdefy check` must not be nagged on every build.
function run({ components, context }) {
  const sites = collectLayoutSites({ components });
  if (sites.length === 0) return;

  const files = new Set();
  sites.forEach((site) => {
    context.handleWarning(
      new ConfigWarning(describeLayoutSite(site), {
        configKey: site.configKey,
        checkSlug: 'layout-deprecated',
      })
    );
    const location = resolveConfigLocation({
      configKey: site.configKey,
      keyMap: context.keyMap,
      refMap: context.refMap,
    });
    if (location?.source) {
      files.add(location.source.split(':')[0]);
    }
  });

  const where = files.size > 0 ? ` in ${files.size} file${files.size === 1 ? '' : 's'}` : '';
  context.handleWarning(
    new ConfigWarning(
      `layout: is deprecated: ${sites.length} site${
        sites.length === 1 ? '' : 's'
      }${where}. Row, Grid and Stack replace it. Run the "layout-to-containers" codemod to rewrite them; layout: keeps working in v8.`,
      { checkSlug: 'layout-deprecated' }
    )
  );
}

const layoutDeprecated = {
  slug: 'layout-deprecated',
  checkOnly: true,
  run,
};

export default layoutDeprecated;
