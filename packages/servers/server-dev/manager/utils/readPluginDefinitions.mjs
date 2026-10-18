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

import path from 'path';
import { collectPluginDefinitions, readFile } from '@lowdefy/node-utils';
import YAML from 'yaml';

// The plugins lowdefy.yaml lists, read straight from the file: the plugin
// type maps are read before the config build, which needs them. plugins is
// every package the server installs (root plugins, then shell-only plugins);
// shellPlugins the packages mobile.shells[].plugins lists, for native types.
async function readPluginDefinitions({ directories }) {
  let lowdefyYaml = await readFile(path.join(directories.config, 'lowdefy.yaml'));
  if (!lowdefyYaml) {
    lowdefyYaml = await readFile(path.join(directories.config, 'lowdefy.yml'));
  }
  if (!lowdefyYaml) {
    return { plugins: [], shellPlugins: [] };
  }
  return collectPluginDefinitions({ lowdefy: YAML.parse(lowdefyYaml) });
}

export default readPluginDefinitions;
