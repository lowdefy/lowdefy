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
import checkNjkRuntimeOperators from './checkNjkRuntimeOperators.js';
import parseNunjucks from './parseNunjucks.js';
import { DEFERRED_KEY } from './deferredRegistry.js';

// '~deferred' is the build's deferred-record placeholder key. Unlike the other
// build markers it is enumerable (that durability is the point), so user config
// could collide with it — a literal '~deferred' key would be dispatched as a
// placeholder far from its source. Reject it where file content first enters
// the walker, with file provenance.
function assertNoReservedKeys(value, filePath) {
  if (type.isArray(value)) {
    for (const item of value) {
      assertNoReservedKeys(item, filePath);
    }
    return;
  }
  if (!type.isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (key === DEFERRED_KEY) {
      throw new ConfigError(
        `The key "${DEFERRED_KEY}" is reserved by the Lowdefy build and cannot be used in config.`,
        { filePath }
      );
    }
    assertNoReservedKeys(value[key], filePath);
  }
}

function parseYamlWithLineNumbers(content, filePath) {
  const doc = YAML.parseDocument(content);
  if (doc.errors && doc.errors.length > 0) {
    throw new Error(doc.errors[0].message);
  }
  return addLineNumbers(doc.contents, content, undefined, { filePath });
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
      if (ext !== 'yaml' && ext !== 'yml' && ext !== 'json') {
        checkNjkRuntimeOperators({ content, path });
      }
    }

    if (ext === 'yaml' || ext === 'yml') {
      try {
        content = parseYamlWithLineNumbers(content, path);
      } catch (error) {
        // An expression compile error is already a located ConfigError; do not
        // re-wrap it as a YAML parse error.
        if (error instanceof ConfigError) throw error;
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

  assertNoReservedKeys(content, type.isString(path) ? path : null);
  return content;
}

export default parseRefContent;
