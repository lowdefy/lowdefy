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

import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';
import lintFilePlugins from '../../build/filePlugins/lintFilePlugins.js';

// A file plugin is compiled by Vite, not by the build, so without this rule an
// agent's syntax error in plugins/blocks/Card.jsx first appears as a browser
// overlay with no config location, and a misspelled global only fails when the
// block renders. Runs on every build for the same reason the _js lint does.
function run({ context }) {
  lintFilePlugins({ filePlugins: context.filePlugins ?? [] }).forEach(
    ({ environmentDescription, relativePath, syntaxError, undefinedNames, unusedNames }) => {
      const meta = { filePath: relativePath, checkSlug: 'js-lint' };
      if (syntaxError) {
        collectExceptions(
          context,
          new ConfigError(
            `File plugin "${relativePath}" has a syntax error at line ${syntaxError.line}: ${syntaxError.message}.`,
            { ...meta, lineNumber: syntaxError.line }
          )
        );
        return;
      }
      undefinedNames.forEach(({ line, name }) => {
        collectExceptions(
          context,
          new ConfigError(
            `File plugin "${relativePath}" references "${name}", which is not defined, at line ${line}. This plugin runs ${environmentDescription}. Import it, or use a global that environment has.`,
            { ...meta, lineNumber: line }
          )
        );
      });
      unusedNames.forEach(({ line, name }) => {
        context.handleWarning(
          new ConfigWarning(
            `File plugin "${relativePath}" declares "${name}" but never uses it, at line ${line}.`,
            { ...meta, lineNumber: line }
          )
        );
      });
    }
  );
}

const filePluginLint = {
  slug: 'js-lint',
  checkOnly: false,
  run,
};

export default filePluginLint;
