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

import licenseHeader from './licenseHeader.mjs';
import reactInJsxScope from './reactInJsxScope.mjs';
import relativeImportExtension from './relativeImportExtension.mjs';

// Rules for this repository's own conventions (CLAUDE.md) that no maintained plugin covers.
const lowdefyPlugin = {
  meta: { name: 'lowdefy-repo' },
  rules: {
    'license-header': licenseHeader,
    'react-in-jsx-scope': reactInJsxScope,
    'relative-import-extension': relativeImportExtension,
  },
};

export default lowdefyPlugin;
