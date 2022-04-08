/*
  Copyright 2020-2022 Lowdefy, Inc

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

import recursiveBuild from './recursiveBuild.js';
import makeRefDefinition from './makeRefDefinition.js';
// TODO: build operators aren't evaluated in lowdefy.yaml file. Move recursive call up a layer or something.
async function buildRefs({ context }) {
  const components = await recursiveBuild({
    context,
    refDef: makeRefDefinition('lowdefy.yaml'),
    count: 0,
  });
  return components || {};
}

export default buildRefs;
