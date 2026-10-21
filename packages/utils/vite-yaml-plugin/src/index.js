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

import yamlToJs from './yamlToJs.js';

// Vite's ?raw and ?url imports load the file itself, so they are left alone.
const skippedQueries = /(^|&)(raw|url)(=|&|$)/;

function yamlPlugin({ include = /\.yaml$/ } = {}) {
  return {
    name: 'lowdefy-yaml',
    transform(source, id) {
      const [file, query = ''] = id.split('?');
      if (!include.test(file) || skippedQueries.test(query)) {
        return null;
      }
      return { code: `export default ${yamlToJs(source)};`, map: null };
    },
  };
}

export default yamlPlugin;
