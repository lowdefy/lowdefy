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

/* eslint-disable no-param-reassign */

import { type } from '@lowdefy/helpers';
import { getFileExtension, getFileSubExtension } from '@lowdefy/node-utils';
import JSON5 from 'json5';
import YAML from 'yaml';

import parseNunjucks from './parseNunjucks.js';

function parseRefContent({ content, refDef }) {
  const { path, vars } = refDef;
  if (type.isString(path)) {
    let ext = getFileExtension(path);
    if (ext === 'njk') {
      content = parseNunjucks(content, vars);
      ext = getFileSubExtension(path);
    }

    if (ext === 'yaml' || ext === 'yml') {
      content = YAML.parse(content);
    }
    if (ext === 'json') {
      content = JSON5.parse(content);
    }
  }

  return content;
}

export default parseRefContent;
