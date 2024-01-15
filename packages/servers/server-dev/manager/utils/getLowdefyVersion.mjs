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

import path from 'path';
import { type } from '@lowdefy/helpers';
import { readFile } from '@lowdefy/node-utils';
import YAML from 'yaml';

async function getLowdefyVersion(context) {
  let lowdefyYaml = await readFile(path.join(context.directories.config, 'lowdefy.yaml'));
  if (!lowdefyYaml) {
    lowdefyYaml = await readFile(path.join(context.directories.config, 'lowdefy.yml'));
  }
  if (!lowdefyYaml) {
    throw new Error(`Could not find "lowdefy.yaml" file.`);
  }
  let lowdefy;
  try {
    lowdefy = YAML.parse(lowdefyYaml);
  } catch (error) {
    throw new Error(`Could not parse "lowdefy.yaml" file. Received error ${error.message}.`);
  }
  if (!lowdefy.lowdefy) {
    throw new Error(
      `No version specified in "lowdefy.yaml" file. Specify a version in the "lowdefy" field.`
    );
  }
  if (!type.isString(lowdefy.lowdefy)) {
    throw new Error(
      `Version number specified in "lowdefy.yaml" file should be a string. Received ${JSON.stringify(
        lowdefy.lowdefy
      )}.`
    );
  }
  return lowdefy.lowdefy;
}

export default getLowdefyVersion;
