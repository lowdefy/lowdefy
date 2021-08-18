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

import { type } from '@lowdefy/helpers';
import { getFileExtension, getFileSubExtension } from '@lowdefy/node-utils';
import JSON5 from 'json5';
import YAML from 'js-yaml';

import parseNunjucks from './parseNunjucks';

function parseRefContent({ content, vars, path }) {
  let ext = getFileExtension(path);
  if (ext === 'njk') {
    content = parseNunjucks(content, vars, path);
    ext = getFileSubExtension(path);
  }

  if (ext === 'yaml' || ext === 'yml') {
    return YAML.load(content);
  }
  if (ext === 'json') {
    return JSON5.parse(content);
  }
  return content;
}

async function getRefContent({ context, refDef, referencedFrom }) {
  if (!type.isString(refDef.path)) {
    throw new Error(
      `Invalid _ref definition ${JSON.stringify({
        _ref: refDef.original,
      })} in file ${referencedFrom}`
    );
  }

  const { path, vars } = refDef;
  let content;
  content = await context.readConfigFile(path);

  if (content === null) {
    throw new Error(`Tried to reference file with path "${path}", but file does not exist.`);
  }

  return parseRefContent({ content, vars, path });
}

export default getRefContent;
