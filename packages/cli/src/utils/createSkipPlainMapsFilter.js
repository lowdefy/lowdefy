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

// Production builds also write keyMap.json.gz and refMap.json.gz, which the
// server reads to name an error's YAML file and line. The plain maps can be
// hundreds of MB on a large app, past Vercel's function size limit, so deploy
// output leaves them out and ships only the gzipped copies.
const PLAIN_MAPS = ['keyMap.json', 'refMap.json'];

function createSkipPlainMapsFilter({ buildDirectory }) {
  const skipped = new Set(PLAIN_MAPS.map((file) => path.join(path.resolve(buildDirectory), file)));
  return function skipPlainMaps(src) {
    return !skipped.has(path.resolve(src));
  };
}

export default createSkipPlainMapsFilter;
