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

import { Linter, RuleTester } from 'eslint';

import reactInJsxScope from './reactInJsxScope.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

const languageOptions = { parserOptions: { ecmaFeatures: { jsx: true } } };

new RuleTester({ languageOptions }).run('react-in-jsx-scope', reactInJsxScope, {
  valid: [
    "import React from 'react';\nconst a = <div />;",
    "import * as React from 'react';\nconst a = <></>;",
    { code: 'const a = <div />;', options: [{ runtime: 'automatic' }] },
    'const a = 1;',
  ],
  invalid: [
    {
      code: "import { useState } from 'react';\nconst a = <div><span /></div>;",
      output:
        "import React from 'react';\nimport { useState } from 'react';\nconst a = <div><span /></div>;",
      errors: [{ messageId: 'missing' }],
    },
    {
      code: 'const a = <></>;',
      output: null,
      errors: [{ messageId: 'missing' }],
    },
  ],
});

describe('react-in-jsx-scope with no-unused-vars', () => {
  function lint({ code, runtime }) {
    const linter = new Linter();
    return linter.verify(code, {
      languageOptions: { ...languageOptions, sourceType: 'module' },
      plugins: { local: { rules: { 'react-in-jsx-scope': reactInJsxScope } } },
      rules: { 'local/react-in-jsx-scope': ['error', { runtime }], 'no-unused-vars': 'error' },
    });
  }

  it('does not report a React import used only by JSX', ({ assert }) => {
    assert.deepEqual(
      lint({ code: "import React from 'react';\nexport const a = <div />;", runtime: 'classic' }),
      []
    );
    assert.deepEqual(
      lint({ code: "import React from 'react';\nexport const a = <div />;", runtime: 'automatic' }),
      []
    );
  });

  it('reports a React import in a file without JSX', ({ assert }) => {
    const messages = lint({
      code: "import React from 'react';\nexport const a = 1;",
      runtime: 'classic',
    });
    assert.deepEqual(
      messages.map((message) => message.ruleId),
      ['no-unused-vars']
    );
  });
});
