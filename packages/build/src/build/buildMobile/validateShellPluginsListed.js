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

import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';

// The server installs shell plugins, and reads their native types, from a raw
// read of lowdefy.yaml, before the build resolves refs. A shell plugin that
// read could not see (mobile, shells or plugins under _ref) is not installed
// and has no types, so the build fails rather than leave its types out.
function validateShellPluginsListed({ mobile, context }) {
  const listed = new Set(context.typesMapMobile.plugins);
  (mobile.shells ?? []).forEach((shell) => {
    (shell.plugins ?? []).forEach((plugin) => {
      if (listed.has(plugin.name)) {
        return;
      }
      collectExceptions(
        context,
        new ConfigError(
          `Shell "${shell.id}" lists plugin "${plugin.name}", which the server did not install. List shell plugins in lowdefy.yaml itself, not under _ref, as root plugins are.`,
          { configKey: plugin['~k'] }
        )
      );
    });
  });
}

export default validateShellPluginsListed;
