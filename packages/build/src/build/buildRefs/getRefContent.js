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

import { ConfigError } from '@lowdefy/errors/build';

import getConfigFile from './getConfigFile.js';
import parseRefContent from './parseRefContent.js';
import runRefResolver from './runRefResolver.js';

async function getRefContent({ context, refDef, referencedFrom }) {
  let content;
  if (refDef.path === 'lowdefy.yaml' || refDef.path === 'lowdefy.yml') {
    content = await getConfigFile({ context, refDef, referencedFrom });
  } else if (refDef.resolver || context.refResolver) {
    content = await runRefResolver({ context, refDef, referencedFrom });
  } else {
    content = await getConfigFile({ context, refDef, referencedFrom });
  }

  try {
    return parseRefContent({ content, refDef });
  } catch (error) {
    // Extract line number from YAML parse error message (e.g., "at line 6")
    const lineMatch = error.message.match(/at line (\d+)/);
    // Re-throw parse errors as ConfigError with location info
    throw new ConfigError({
      message: `Error parsing "${refDef.path}": ${error.message}`,
      filePath: refDef.path,
      lineNumber: lineMatch ? lineMatch[1] : null,
      configDirectory: context.directories.config,
    });
  }
}

export default getRefContent;
