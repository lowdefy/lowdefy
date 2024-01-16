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

import writeActionImports from './writeActionImports.js';
import writeAuthImports from './writeAuthImports.js';
import writeBlockImports from './writeBlockImports.js';
import writeConnectionImports from './writeConnectionImports.js';
import writeIconImports from './writeIconImports.js';
import writeOperatorImports from './writeOperatorImports.js';
import writeStyleImports from './writeStyleImports.js';

async function writePluginImports({ components, context }) {
  await writeActionImports({ components, context });
  await writeAuthImports({ components, context });
  await writeBlockImports({ components, context });
  await writeConnectionImports({ components, context });
  await writeIconImports({ components, context });
  await writeOperatorImports({ components, context });
  await writeStyleImports({ components, context });
}

export default writePluginImports;
