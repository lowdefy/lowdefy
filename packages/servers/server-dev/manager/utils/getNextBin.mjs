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
import { createRequire } from 'module';

function getNextBin() {
  const require = createRequire(import.meta.url);
  const nextPackageJson = require('next/package.json');

  const nextPath = require.resolve('next');
  let nextMainFragment = nextPackageJson.main.substring(1);
  let nextBinFragment = nextPackageJson.bin.next;

  if (process.platform === 'win32') {
    nextMainFragment = nextMainFragment.replaceAll('/', '\\');
    nextBinFragment = nextBinFragment.replaceAll('/', '\\');
  }

  return path.join(nextPath.replace(nextMainFragment, ''), nextBinFragment);
}

export default getNextBin;
