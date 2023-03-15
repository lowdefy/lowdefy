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

import path from 'path';
import { get, type } from '@lowdefy/helpers';
import { readFile } from '@lowdefy/node-utils';
import YAML from 'js-yaml';

async function getLowdefyYaml({ baseDirectory, requiresLowdefyYaml }) {
  let lowdefyYaml = await readFile(path.resolve(baseDirectory, 'lowdefy.yaml'));
  if (!lowdefyYaml) {
    lowdefyYaml = await readFile(path.resolve(baseDirectory, 'lowdefy.yml'));
  }
  if (!lowdefyYaml) {
    if (requiresLowdefyYaml) {
      throw new Error(
        `Could not find "lowdefy.yaml" file in specified base directory ${baseDirectory}.`
      );
    }
    return { cliConfig: {} };
  }
  let lowdefy;
  try {
    lowdefy = YAML.load(lowdefyYaml);
  } catch (error) {
    throw new Error(`Could not parse "lowdefy.yaml" file. Received error ${error.message}.`);
  }
  if (!lowdefy.lowdefy) {
    throw new Error(
      `No version specified in "lowdefy.yaml" file. Specify a version in the "lowdefy" field.`
    );
  }
  if (!type.isString(lowdefy.lowdefy) || !lowdefy.lowdefy.match(/\d+\.\d+\.\d+(-\w+\.\d+)?/)) {
    throw new Error(
      `Version number specified in "lowdefy.yaml" file is not valid. Received ${JSON.stringify(
        lowdefy.lowdefy
      )}.`
    );
  }
  return {
    lowdefyVersion: lowdefy.lowdefy,
    cliConfig: get(lowdefy, 'cli', { default: {} }),
  };
}

export default getLowdefyYaml;
