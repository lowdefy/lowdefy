/*
  Copyright 2020 Lowdefy, Inc

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
import YAML from 'js-yaml';

async function getLowdefyVersion(context = {}) {
  const lowdefyYaml = await readFile(
    path.resolve(context.baseDirectory || process.cwd(), 'lowdefy.yaml')
  );
  if (!lowdefyYaml) {
    if (context.baseDirectory) {
      throw new Error(
        `Could not find "lowdefy.yaml" file in specified base directory ${context.baseDirectory}.`
      );
    }
    throw new Error(
      `Could not find "lowdefy.yaml" file in current working directory. Change directory to a Lowdefy project, or specify a base directory.`
    );
  }
  let lowdefy;
  try {
    lowdefy = YAML.safeLoad(lowdefyYaml);
  } catch (error) {
    throw new Error(`Could not parse "lowdefy.yaml" file. Received error ${error.message}.`);
  }
  if (!lowdefy.version) {
    throw new Error(
      `No version specified in "lowdefy.yaml" file. Specify a version in the "version field".`
    );
  }
  if (!type.isString(lowdefy.version) || !lowdefy.version.match(/\d+\.\d+\.\d+(-\w+\.\d+)?/)) {
    throw new Error(
      `Version number specified in "lowdefy.yaml" file is not valid. Received ${JSON.stringify(
        lowdefy.version
      )}.`
    );
  }
  return lowdefy.version;
}

export default getLowdefyVersion;
