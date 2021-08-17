/*
  Copyright 2020-2021 Lowdefy, Inc

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

import JSON5 from 'json5';
import YAML from 'js-yaml';
import { type } from '@lowdefy/helpers';
import { getFileExtension, readFile } from '@lowdefy/node-utils';

async function getJsonFile(filePath) {
  const file = await readFile(filePath);
  return JSON5.parse(file);
}

async function getYamlFile(filePath) {
  const file = await readFile(filePath);
  return YAML.load(file);
}

async function getTextFile(filePath) {
  return readFile(filePath);
}

async function handleFileType(filePath) {
  const ext = getFileExtension(filePath);
  switch (ext) {
    case 'yaml':
    case 'yml':
      return getYamlFile(filePath);
    case 'json':
      return getJsonFile(filePath);
    default:
      return getTextFile(filePath);
  }
}

async function getFile(filePath) {
  if (type.isString(filePath)) {
    return handleFileType(filePath);
  }
  throw new Error(
    `Tried to get file with file path ${JSON.stringify(filePath)}, but file path should be a string`
  );
}

export default getFile;
