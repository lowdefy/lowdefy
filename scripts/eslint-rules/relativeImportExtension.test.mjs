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

import path from 'node:path';
import { describe, it } from 'node:test';

import { RuleTester } from 'eslint';

import relativeImportExtension from './relativeImportExtension.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

// Specifiers resolve against this folder: ./index.mjs and ./licenseHeader.mjs exist.
const filename = path.join(import.meta.dirname, 'fixture.mjs');

new RuleTester().run('relative-import-extension', relativeImportExtension, {
  valid: [
    { code: "import a from './licenseHeader.mjs';", filename },
    { code: "import a from '../lib/parseArgs.mjs';", filename },
    { code: "import data from './data.json' with { type: 'json' };", filename },
    { code: "import raw from './template.njk?raw';", filename },
    { code: "import { get } from '@lowdefy/helpers';", filename },
    { code: "import fs from 'node:fs';", filename },
    { code: "const a = await import(name + '.js');", filename },
    { code: "const a = require('./licenseHeader');", filename },
  ],
  invalid: [
    {
      code: "import a from './licenseHeader';",
      output: "import a from './licenseHeader.mjs';",
      filename,
      errors: [{ messageId: 'missing' }],
    },
    {
      code: "export { default } from './licenseHeader';",
      output: "export { default } from './licenseHeader.mjs';",
      filename,
      errors: [{ messageId: 'missing' }],
    },
    {
      code: "export * from './licenseHeader';",
      output: "export * from './licenseHeader.mjs';",
      filename,
      errors: [{ messageId: 'missing' }],
    },
    {
      code: "const a = await import('./licenseHeader');",
      output: "const a = await import('./licenseHeader.mjs');",
      filename,
      errors: [{ messageId: 'missing' }],
    },
    {
      code: "import a from '.';",
      output: "import a from './index.mjs';",
      filename,
      errors: [{ messageId: 'missing' }],
    },
    {
      code: "import a from './doesNotExist';",
      output: null,
      filename,
      errors: [{ messageId: 'missingUnknown' }],
    },
  ],
});
