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

import emitModule from './emit/emitModule.js';
import makeFileId from './emit/fileId.js';
import parseYamlSource from './parse/parseYamlSource.js';

// Compiles one config source file to an ES module.
// `.yaml.njk` structural templating is removed (config-compiler D5):
// the runtime _nunjucks operator and _build.* string operators replace it.
function compileSource({
  source,
  file,
  mode = 'errors',
  resolveImport,
  refExists,
  configDir,
  moduleRoot,
  runtimeSpecifier,
}) {
  if (file.endsWith('.njk')) {
    throw new ConfigError(
      `Structural nunjucks templates (.yaml.njk) are no longer supported — "${file}". ` +
        `Run the v7 migration codemod: {{ var }} becomes _var, string-built ids become ` +
        `_build.nunjucks or _build.string.concat, {% if %} becomes _build.if with ` +
        `_build.array.compact for conditional list membership. ` +
        `The runtime _nunjucks operator is unchanged.`,
      { filePath: file }
    );
  }
  const ir = parseYamlSource({ source, file });
  const fileId = makeFileId(file);
  const { code, staticRefs, keyMap } = emitModule({
    ir,
    file,
    fileId,
    mode,
    resolveImport,
    refExists,
    configDir,
    moduleRoot,
    runtimeSpecifier,
  });
  return { code, file, fileId, staticRefs, keyMap };
}

export default compileSource;
