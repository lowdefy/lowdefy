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

import path from 'path';
import YAML from 'yaml';
import { ConfigError } from '@lowdefy/errors';

import addLineNumbers from './addLineNumbers.js';

// Reads and parses a module manifest (module.lowdefy.yaml, absolute path)
// with ~l line marks — raw preserved zones carry their source lines into
// registry consumption and lazy var-default resolution.
async function readManifestFile({ context, filePath }) {
  const content = await context.readConfigFile(filePath);
  if (content === null) {
    const absolutePath = path.resolve(context.directories.config, filePath);
    throw new ConfigError(
      `Referenced file does not exist: "${filePath}". Resolved to: ${absolutePath}`,
      { filePath: null, lineNumber: null }
    );
  }
  const doc = YAML.parseDocument(content);
  if (doc.errors && doc.errors.length > 0) {
    throw new ConfigError(`YAML parse error in "${filePath}".`, {
      cause: doc.errors[0],
      filePath,
    });
  }
  return addLineNumbers(doc.contents, content);
}

export default readManifestFile;
