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

import { describe, it } from 'node:test';

import { RuleTester } from 'eslint';

import licenseHeader from './licenseHeader.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const year = new Date().getFullYear();
const header = `/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
*/`;
const fixedHeader = `/*
  Copyright 2020-${year} Lowdefy, Inc

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

`;

new RuleTester().run('license-header', licenseHeader, {
  valid: [
    `${header}\n\nconst a = 1;`,
    `#!/usr/bin/env node\n${header}\nconst a = 1;`,
    // An older end year passes; the years are bumped together each January.
    `${header.replace('2026', '2025')}\nconst a = 1;`,
    header,
  ],
  invalid: [
    {
      code: 'const a = 1;\n',
      output: `${fixedHeader}const a = 1;\n`,
      errors: [{ messageId: 'missing' }],
    },
    {
      code: `#!/usr/bin/env node\nconst a = 1;\n`,
      output: `#!/usr/bin/env node\n${fixedHeader}\nconst a = 1;\n`,
      errors: [{ messageId: 'missing' }],
    },
    {
      code: `// A note first.\n${header}\nconst a = 1;`,
      output: `${fixedHeader}// A note first.\n${header}\nconst a = 1;`,
      errors: [{ messageId: 'missing' }],
    },
    {
      code: `const a = 1;\n${header}\n`,
      output: `${fixedHeader}const a = 1;\n${header}\n`,
      errors: [{ messageId: 'missing' }],
    },
  ],
});
