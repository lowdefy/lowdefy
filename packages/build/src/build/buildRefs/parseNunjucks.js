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
import { getFileSubExtension } from '@lowdefy/node-utils';
import { nunjucksFunction } from '@lowdefy/nunjucks';
import JSON5 from 'json5';
import YAML from 'js-yaml';

function parseNunjucks(fileContent, vars, path) {
  const template = nunjucksFunction(fileContent);
  const templated = template(vars);
  const subExt = getFileSubExtension(path);
  if (subExt === 'yaml' || subExt === 'yml') {
    return YAML.load(templated);
  }
  if (subExt === 'json') {
    return JSON5.parse(templated);
  }
  return templated;
}

export default parseNunjucks;
