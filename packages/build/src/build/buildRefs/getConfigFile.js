/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { ConfigError } from '@lowdefy/errors/build';

async function getConfigFile({ context, refDef, referencedFrom }) {
  if (!type.isString(refDef.path)) {
    throw new ConfigError({
      message: `Invalid _ref definition: ${JSON.stringify({ _ref: refDef.original })}`,
      filePath: referencedFrom,
      lineNumber: refDef.lineNumber,
      configDirectory: context.directories.config,
    });
  }

  const content = await context.readConfigFile(refDef.path);

  if (content === null) {
    const absolutePath = path.resolve(context.directories.config, refDef.path);

    let message = `Referenced file does not exist: "${refDef.path}". Resolved to: ${absolutePath}`;

    // Help with common mistakes
    if (refDef.path.startsWith('../')) {
      const suggestedPath = refDef.path.replace(/^(\.\.\/)+/, '');
      message += ` Tip: Paths in _ref are resolved from config root. Did you mean "${suggestedPath}"?`;
    } else if (refDef.path.startsWith('./')) {
      const suggestedPath = refDef.path.substring(2);
      message += ` Tip: Remove "./" prefix - paths are resolved from config root. Did you mean "${suggestedPath}"?`;
    }

    throw new ConfigError({
      message,
      filePath: referencedFrom,
      lineNumber: refDef.lineNumber,
      configDirectory: context.directories.config,
    });
  }

  return content;
}

export default getConfigFile;
