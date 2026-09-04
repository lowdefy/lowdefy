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

import path from 'node:path';

import YAML from 'yaml';
import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import readFile from '../readFile.js';
import moduleLockfileName from './moduleLockfileName.js';

async function readModuleLockfile({ configDirectory }) {
  const filePath = path.join(configDirectory, moduleLockfileName);
  const content = await readFile(filePath);
  if (type.isNone(content) || content.trim() === '') return {};

  let parsed;
  try {
    parsed = YAML.parse(content);
  } catch (error) {
    throw new ConfigError(`Could not parse ${moduleLockfileName}: ${error.message}`, {
      cause: error,
    });
  }

  if (type.isNone(parsed)) return {};
  if (!type.isObject(parsed)) {
    throw new ConfigError(
      `${moduleLockfileName} should be a map of module entry ids to lock entries. Received ${JSON.stringify(
        parsed
      )}.`
    );
  }
  return parsed;
}

export default readModuleLockfile;
