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

import { addFilePluginTypes, discoverFilePlugins } from '@lowdefy/build';

/**
 * Adds the config directory's file plugins to the dev manager's customTypesMap,
 * which shallowBuild persists as customTypesMap.json for the JIT page builder
 * and the docs endpoints to read.
 *
 * Discovery errors and collisions are not reported here: createContext runs the
 * same discovery for every build and buildTypes reports them with their file
 * location, so reporting them twice would double every message.
 */
function addFilePluginTypesToMap({ directories, typesMap }) {
  const { records } = discoverFilePlugins({ configDirectory: directories.config });
  addFilePluginTypes({ records, typesMap });
  return records;
}

export default addFilePluginTypesToMap;
