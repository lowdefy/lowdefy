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

import { type } from '@lowdefy/helpers';
import { getFileExtension } from '@lowdefy/node-utils';

import getConfigFile from './getConfigFile.js';
import getParsedConfigFile from './getParsedConfigFile.js';
import getUserJavascriptFunction from './getUserJavascriptFunction.js';
import parseRefContent from './parseRefContent.js';
import runRefResolver from './runRefResolver.js';

// Plain YAML and JSON files parse the same for every ref, so they go through the
// parse cache. A .njk file renders with each ref's vars, and resolver content
// cannot be keyed by path, so both are parsed per ref.
const cachedExtensions = new Set(['yaml', 'yml', 'json']);

async function readConfigFileContent({ context, refDef, referencedFrom }) {
  const content = await getConfigFile({ context, refDef, referencedFrom });
  if (cachedExtensions.has(getFileExtension(refDef.path))) {
    return getParsedConfigFile({ context, content, refDef });
  }
  return parseRefContent({ content, refDef });
}

async function getRefContent({ context, refDef, referencedFrom }) {
  if (refDef.path === 'lowdefy.yaml' || refDef.path === 'lowdefy.yml') {
    return readConfigFileContent({ context, refDef, referencedFrom });
  }
  if (refDef.resolver || context.refResolver) {
    const content = await runRefResolver({ context, refDef, referencedFrom });
    return parseRefContent({ content, refDef });
  }
  if (type.isString(refDef.path) && getFileExtension(refDef.path) === 'js') {
    return getUserJavascriptFunction({ context, filePath: refDef.path });
  }
  return readConfigFileContent({ context, refDef, referencedFrom });
}

export default getRefContent;
