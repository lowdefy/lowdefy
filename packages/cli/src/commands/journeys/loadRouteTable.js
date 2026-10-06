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

import fs from 'fs';
import path from 'path';
import { serializer, type } from '@lowdefy/helpers';

function readArtifact({ buildDirectory, name }) {
  return serializer.deserializeFromString(fs.readFileSync(path.join(buildDirectory, name), 'utf8'));
}

// The build's route table and basePath, which is how the journey sequence
// reads the page an expect.url path landed on. With no build, the sequence
// moves its page only at a goto.
function loadRouteTable({ buildDirectory }) {
  if (type.isUndefined(buildDirectory)) return { routes: [], basePath: '' };
  return {
    routes: readArtifact({ buildDirectory, name: 'routes.json' }),
    basePath: readArtifact({ buildDirectory, name: 'config.json' }).basePath ?? '',
  };
}

export default loadRouteTable;
