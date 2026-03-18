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
import { type } from '@lowdefy/helpers';
import { getFileExtension, getFileSubExtension } from '@lowdefy/node-utils';
import JSON5 from 'json5';
import YAML from 'yaml';

import addLineNumbers from './addLineNumbers.js';
import parseNunjucks from './parseNunjucks.js';

function parseYamlWithLineNumbers(content) {
  const doc = YAML.parseDocument(content);
  if (doc.errors && doc.errors.length > 0) {
    throw new Error(doc.errors[0].message);
  }
  return addLineNumbers(doc.contents, content);
}

async function parseRefContent({ content, refDef }) {
  const { path, vars } = refDef;
  if (type.isString(path)) {
    let ext = getFileExtension(path);
    const isNjk = ext === 'njk';
    if (isNjk) {
      try {
        content = parseNunjucks(content, vars);
      } catch (error) {
        throw new ConfigError(`Nunjucks error in "${path}".`, {
          cause: error,
          filePath: path,
        });
      }
      ext = getFileSubExtension(path);
    }

    if (ext === 'yaml' || ext === 'yml') {
      try {
        content = parseYamlWithLineNumbers(content);
      } catch (error) {
        if (isNjk) {
          throw new ConfigError(`Nunjucks template "${path}" produced invalid YAML.`, {
            cause: error,
            filePath: path,
          });
        }
        const lineMatch = error.message.match(/at line (\d+)/);
        throw new ConfigError(`YAML parse error in "${path}".`, {
          cause: error,
          filePath: path,
          lineNumber: lineMatch ? lineMatch[1] : null,
        });
      }
    }
    if (ext === 'json') {
      try {
        content = JSON5.parse(content);
      } catch (error) {
        throw new ConfigError(`JSON parse error in "${path}".`, {
          cause: error,
          filePath: path,
        });
      }
    }
  }

  return content;
}

export default parseRefContent;
